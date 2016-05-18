var Botkit = require('botkit');
var builder = require('botbuilder');
var restify = require('restify');

var controller = Botkit.slackbot();
var bot = controller.spawn({
   token: ''
});

function search(session){
  if (!session.userData.keyword) {
        session.beginDialog('/keyword');
  } else  if (!session.userData.fresh_search){
      session.send('I don\'t understand your command: Use quit to finish the search');
  }else{

    var keyword = session.userData.keyword;
    var page = session.userData.page;
    var client = restify.createJsonClient({
      url: 'https://api.github.com'
    });


    client.get('/search/code?q='+keyword+'+in:file+repo:azure/azure-content&page='+page+'&per_page=5', function(err, req, res, obj) {
      if (obj.total_count>0){
       session.send('I\'ve found these results for you:');
        for( var k in obj.items){
          var item = obj.items[k]
          session.send(item.name+" ("+item.html_url+")" ) ;
        }
        session.send('Showing results from '+ (((page-1)*5)+1) +' to '+ page*5 + '. Number of results '+ obj.total_count + '. If you want to see more results please say \'more\'');
        session.userData.fresh_search = false;

      }else{
        session.send('I haven\'t found any result. Please start your search again');
        session.userData.fresh_search = true;
        session.userData.page=1;
        session.userData.keyword=null;
        session.endDialog();
      }
      });



    }
}

var slackBot = new builder.SlackBot(controller, bot);
// Create bot and add dialogs
slackBot.add('/', new builder.CommandDialog()
    .matches('^search', builder.DialogAction.beginDialog('/search'))
    .matches('^quit', function(session){
      session.send('Thanks for using me! If you want to ')
      builder.DialogAction.endDialog();
  })
    .onDefault(function (session) {
          session.send('Hello! If you want to use me, say \'search\'');
    }));

slackBot.add('/search', new builder.CommandDialog().matches('^quit', function (session){
  session.userData.keyword=null;
  session.userData.page=null;
  session.endDialog();

})
  .matches('^more',function(session){
        session.userData.page++;
        session.userData.fresh_search=true;
        search(session);
  })
  .onDefault( function (session) {
    search(session);
  }));





slackBot.add('/keyword', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What are you looking for?');
    },
    function (session, results) {
        session.userData.keyword = results.response;
        session.userData.fresh_search=true;
        session.userData.page=1;
        session.endDialog();
    }
]);

slackBot.listenForMentions();

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});
