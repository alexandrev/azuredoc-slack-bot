var Botkit = require('botkit');
var builder = require('botbuilder');
var restify = require('restify');

var controller = Botkit.slackbot();
var bot = controller.spawn({
   token: 'xoxb-43644969201-GLi8yM1j0DWqX4Y2rT7Widfm'
});

var slackBot = new builder.SlackBot(controller, bot);
// Create bot and add dialogs
slackBot.add('/', new builder.CommandDialog()
    .matches('^search', builder.DialogAction.beginDialog('/search'))
    .matches('^quit', builder.DialogAction.endDialog())
    .onDefault(function (session) {
          session.send('Hello! If you want to use me, say \'search\'');
    }));

slackBot.add('/search', new builder.CommandDialog().matches('^quit', function (session){
  session.send('Ending the search!')
  session.userData.keyword=null;
  session.endDialog();

})
  .onDefault( function (session) {
  if (!session.userData.keyword) {
          session.beginDialog('/keyword');
      } else  if (!session.userData.fresh_search){
          session.send('I don\'t understand your command: Use quit to finish the search');
      }else{

  var keyword = session.userData.keyword;
  var client = restify.createJsonClient({
    url: 'https://api.github.com'
  });


  client.get('/search/code?q='+keyword+'+in:file+repo:azure/azure-content', function(err, req, res, obj) {
     session.send('I\'ve found these results for you:');
      for( var k in obj.items){
        var item = obj.items[k]
        session.send(item.name+" ("+item.html_url+")" ) ;
      }

  });
  session.userData.fresh_search = false;

}
  }));


slackBot.add('/keyword', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What are you looking for?');
    },
    function (session, results) {
        session.userData.keyword = results.response;
        session.userData.fresh_search=true;
        session.endDialog();
    }
]);

slackBot.listenForMentions();

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});
