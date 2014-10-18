App = Ember.Application.create();
var irc = require('irc');

var attr = DS.attr,
    hasMany = DS.hasMany,
    belongsTo = DS.belongsTo;

App.Router.map(function() {
  // put your routes here
  this.resource('server');
  this.route('channel', {path: '/channels/:channel'});
});

App.IndexRoute = Ember.Route.extend({
  model: function(){
    return this.store.all('serverMessage');
  }
});

App.ChannelRoute = Ember.Route.extend({
  model: function(params){
    return this.store.all('message', {'channel.safeName': params.channel});
  }
});

App.IndexController = Ember.ArrayController.extend({
  needs: ['application'],
  actions:{
    'connectToServer': function(){
      var store = this.store;
      var chan = $('#channelEntry').val();
      var client = new irc.Client($('#serverEntry').val(), $('#nickEntry').val(), {
        channels: ['#' + chan]
      });
      client.addListener('error', function(message) {
        store.push('serverMessage', {
          server: 'whatever',
          message: message
        });
        console.log(message);
      });
      client.addListener('message', function (from, to, message) {
        if (message === '') return false;
        store.push('message', {
          nick: from,
          message: message,
          channel: store.all('channel').content.find(function(element, index, array){
            if (element._data.name === to){
              return element._data;
            }
          })
        });
        setTimeout(function(){$('.messagesArea').scrollTop($('.messagesArea').prop("scrollHeight"))}, 100);
      });
      client.addListener('names', function(channel, nicks){
        var chan = store.all('channel', {name: channel});
        chan.set('names', nicks);
        store.update('channel', chan);
      });
      store.push('server', {
        host: $('#serverEntry').val(),
        nick: $('#nickEntry').val(),
        client: client
      });
      store.push('channel', {
        name: '#' + chan,
        safeName: chan,
        names: ''
      });
      client.addListener('registered', function(message){
        store.push('serverMessage', {
          server: 'whatever',
          message: message
        });
      });
      this.transitionToRoute('channel', chan);
    }
  }
});

App.ChannelController = Ember.ArrayController.extend({
  channelName: function(){
    return this.store.all('channel').content[0]._data.name;
  }.property('model.channelName'),
  user: function(){
    return this.store.all('channel', {name: '#testing'}).get('names');
  }.property('model.user'),
  actions:{
    'sendMessage': function(){
      var store = this.store;
      //this needs to be whatever server they have selected
      client = store.all('server').content[0]._data.client;
      //this line needs to be whatever channel they have selected
      var to = store.all('channel').content[0]._data.name;
      store.all('channel', {name: '#testing'}).get('names');
      client.say(to, $('#messageEntry').val());
      if ($('#messageEntry').val() === '') return false;
      console.log(store.all('channel').content[0]._data.names);
      store.push('message', {
        nick: client.nick,
        message: $('#messageEntry').val(),
        channel: store.all('channel').content.find(function(element, index, array){
          if (element._data.name === to)
            return element._data;
        })
      });
      $('#messageEntry').val("");
    }
  }
});


App.Server = DS.Model.extend({
  host: attr(),
  nick: attr(),
  client: attr(),
  channels: hasMany('channel'),
  serverMessages: hasMany('serverMessage')
});

App.Channel = DS.Model.extend({
  name: attr(),
  safeName: attr(),
  names: attr(),
  topic: attr(),
  messages: hasMany('message'),
  server: belongsTo('server')
});

App.Message = DS.Model.extend({
  nick: attr(),
  message: attr(),
  channel: belongsTo('channel')
});

App.ServerMessage = DS.Model.extend({
  message: attr(),
  server: belongsTo('server')
});
