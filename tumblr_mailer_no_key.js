// Import fs and ejs
var fs = require('fs');
var ejs = require('ejs');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('<-- Your Mandrill API key ;D -->');

// Read in the email template
var emailTemplate = fs.readFileSync('./email_template.ejs', 'utf8');

// Authenticate via OAuth
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: '<-- Your consumer key -->',
  consumer_secret: '<-- Your consumer secret key -->',
  token: '<-- Your token -->',
  token_secret: '<-- Your secret token -->'
});

// Parses the CSV file into an array of objects
function csvParse(csvFile) {
  // Remove errant quotation marks
  csvFile = csvFile.replace(/\"/g, '');
  // Empty array to store the result
  var result = [];
  // Split the CSV into an array of rows
  var rows = csvFile.split('\n');
  // Store the first row in the CSV to be object keys
  var keys = rows[0].split(',');
  
  // Create a new object for each row after the first
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    // Set the key:value pair for each column
    for (var j = 0; j < keys.length; j++) {
      obj[keys[j]] = rows[i].split(',')[j];
    }
    result.push(obj);
  }
  return result;
}
// Sends email using Mandrill
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html) {
  var message = {
    html: message_html,
    subject: subject,
    from_email: from_email,
    to: [{
      email: to_email,
      name: to_name
    }],
    important: false,
    track_opens: true,
    auto_html: false,
    preserve_recipients: true,
    merge: false,
    tags: [
      "Fullstack_Tumblrmailer_Workshop"
    ]
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
    console.log(message);
    console.log(result);
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
}

// Read and parse the csv file
var csvFile = fs.readFileSync("friend_list.csv", "utf8");
var contacts = csvParse(csvFile);

client.posts('yourtumblr.tumblr.com', function(err, blog) {
  var latestPosts = [];
  // Convert to seconds - Tumblr timestamps are in seconds, but JS Date is in milliseconds
  var td = Math.floor(Date.now() / 1000);
  // Number of seconds in a week
  var week = 604800;
  // Finds published Tumblr posts less than a week old, stores them to an array
  for (var i = 0; i < blog.posts.length; i++) {
    if (td - blog.posts[i].timestamp < week && blog.posts[i].state === "published") {
      latestPosts.push(blog.posts[i]);
    }
  }
  for (var i = 0; i < contacts.length; i++) {
    // Add a property to each contact with a reference to latestPosts
    contacts[i].latestPosts = latestPosts;
    // Create a customized template for each contact
    var customizedTemplate = ejs.render(emailTemplate, contacts[i]);
    // Create the other values to use for the send email function
    var to_name = contacts[i].firstName + " " + contacts[i].lastName;
    var to_email = contacts[i].emailAddress;
    var from_name = "Your Name";
    var from_email = "youremail@youremail.com";
    var subject = "My Tumblr Blog";
    // Pass the values above to the send email function to actually send the emails
    sendEmail(to_name, to_email, from_name, from_email, subject, customizedTemplate);
  }
});