var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var math = require('mathjs');

var app = express();
var server = require('http').createServer(app);
var port = parseInt(process.env.PORT, 10) || 80;
app.set('port', port);
server.listen(port);
var io = require('socket.io')(server);

var designers = [null, null, null];
var admin = null;

var tasks = [
  {"name":"Training #1","coupling":[[-1,0,0],[0,-1,0],[0,0,1]],"target":[1,1,1],"inputs":[[0],[1],[2]],"outputs":[[0],[1],[2]]},
  {"name":"Training #2","coupling":[[-1,0,0,0,0,0],[0,1,0,0,0,0],[0,0,-1,0,0,0],[0,0,0,-1,0,0],[0,0,0,0,-1,0],[0,0,0,0,0,-1]],"target":[-0.92882,-0.37052,-0.95163,-0.30724,-0.73705,-0.67584],"inputs":[[0,1],[2,3],[4,5]],"outputs":[[0,1],[2,3],[4,5]]},
  {"name":"Training #3","coupling":[[-0.7221,-0.69179,0,0,0,0],[-0.69179,0.7221,0,0,0,0],[0,0,-0.73447,-0.67864,0,0],[0,0,-0.67864,0.73447,0,0],[0,0,0,0,-0.97194,-0.23524],[0,0,0,0,-0.23524,0.97194]],"target":[-0.82857,-0.55988,-0.22606,-0.97411,-0.69761,-0.71648],"inputs":[[0,1],[2,3],[4,5]],"outputs":[[0,1],[2,3],[4,5]]},
  {"name":"Training #4","coupling":[[1,0,0],[0,-1,0],[0,0,-1]],"target":[-0.11157,-0.6177,-0.77846],"inputs":[[0],[1],[2]],"outputs":[[2],[0],[1]]},
  {"name":"Training #5","coupling":[[-0.4586,0.50321,0.73244],[-0.78132,0.16434,-0.60211],[-0.42336,-0.84839,0.31781]],"target":[-0.8292,-0.54306,-0.13232],"inputs":[[0],[1],[2]],"outputs":[[0],[1],[2]]},
  {"name":"Breezy Rain","coupling":[[1,0,0,0,0,0,0,0,0],[0,-1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,-1]],"target":[-0.65906,-0.70328,-0.26653,-0.50317,-0.85978,-0.087197,-0.69292,-0.32224,-0.645],"inputs":[[0,1,2],[3,4,5],[6,7,8]],"outputs":[[0,1,2],[3,4,5],[6,7,8]]},
  {"name":"Wistful Act","coupling":[[-0.82216,-0.56925],[-0.56925,0.82216]],"target":[-0.6119,-0.79094],"inputs":[[],[0],[1]],"outputs":[[],[0],[1]]},
  {"name":"Onerous Effect","coupling":[[1,0,0],[0,-1,0],[0,0,-1]],"target":[-0.49802,-0.72333,-0.4783],"inputs":[[0],[1],[2]],"outputs":[[1],[0],[2]]},
  {"name":"Hard Development","coupling":[[1,0,0],[0,-1,0],[0,0,1]],"target":[-0.51437,-0.85582,-0.054691],"inputs":[[0],[1],[2]],"outputs":[[0],[2],[1]]},
  {"name":"Better Behavior","coupling":[[-0.79536,0.57157,0.20179],[-0.49767,-0.42573,-0.75569],[-0.34602,-0.70147,0.62306]],"target":[-0.069671,-0.88214,-0.46581],"inputs":[[0],[],[1,2]],"outputs":[[0],[],[1,2]]},
  {"name":"Unwritten Experience","coupling":[[-0.55199,-0.83385],[-0.83385,0.55199]],"target":[-0.9947,-0.10283],"inputs":[[0],[],[1]],"outputs":[[0],[],[1]]},
  {"name":"Hallowed Sign","coupling":[[0.7818,0.62353,0,0,0,0],[0.62353,-0.7818,0,0,0,0],[0,0,-0.80323,-0.59567,0,0],[0,0,-0.59567,0.80323,0,0],[0,0,0,0,-0.62429,-0.78119],[0,0,0,0,-0.78119,0.62429]],"target":[-0.9385,-0.34528,-0.63918,-0.76905,-0.8698,-0.4934],"inputs":[[0,1],[2,3],[4,5]],"outputs":[[0,1],[2,3],[4,5]]},
  {"name":"Husky Verse","coupling":[[-0.27934,-0.96019,0,0,0,0],[-0.96019,0.27934,0,0,0,0],[0,0,-0.99591,-0.090366,0,0],[0,0,-0.090366,0.99591,0,0],[0,0,0,0,-0.62331,-0.78197],[0,0,0,0,-0.78197,0.62331]],"target":[-0.57315,-0.81945,-0.81601,-0.57804,-0.71217,-0.70201],"inputs":[[0,1],[2,3],[4,5]],"outputs":[[0,1],[2,3],[4,5]]},
  {"name":"Economic Motion","coupling":[[-0.54672,0.75133,0.36958],[-0.65185,-0.10489,-0.75106],[-0.52553,-0.65153,0.54711]],"target":[-0.67859,-0.5389,-0.4991],"inputs":[[0],[1],[2]],"outputs":[[0],[1],[2]]},
  {"name":"Arrogant Flame","coupling":[[-0.45433,-0.88791,-0.072126],[-0.65535,0.27829,0.70219],[-0.60341,0.36629,-0.70833]],"target":[-0.26245,-0.90666,-0.3303],"inputs":[[],[0,1],[2]],"outputs":[[],[0,1],[2]]},
  {"name":"Absorbed Copper","coupling":[[-0.39516,0.34889,0.46694,0.71],[-0.59123,-0.79572,0.12938,-0.023125],[-0.56804,0.46824,0.1668,-0.65594],[-0.41428,0.16078,-0.85872,0.25518]],"target":[-0.0083672,-0.6689,-0.41853,-0.61427],"inputs":[[0,1],[2,3],[]],"outputs":[[0,1],[2,3],[]]},
  {"name":"Staking System","coupling":[[-1,0,0],[0,-1,0],[0,0,1]],"target":[-0.47921,-0.061052,-0.87557],"inputs":[[0],[1],[2]],"outputs":[[1],[2],[0]]},
  {"name":"Thinkable Ink","coupling":[[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,-1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,-1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1]],"target":[-0.23542,-0.28829,-0.17228,-0.32282,-0.79892,-0.29882,-0.073798,-0.53791,-0.15715,-0.54218,-0.36703,-0.50183,-0.27881,-0.088512,-0.41968,-0.32315,-0.40127,-0.68764],"inputs":[[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17]],"outputs":[[0,1,2,3,4,5],[6,7,8,9,10,11],[12,13,14,15,16,17]]},
  {"name":"Murky Mass","coupling":[[-0.85979,-0.51065],[-0.51065,0.85979]],"target":[-0.78035,-0.62534],"inputs":[[0],[1],[]],"outputs":[[0],[1],[]]},
  {"name":"Brainy Damage","coupling":[[-0.54202,-0.2549,-0.75219,-0.27468,0,0,0,0,0,0,0,0],[-0.39241,-0.09938,-0.017418,0.91424,0,0,0,0,0,0,0,0],[-0.43674,0.89403,0.044406,-0.089427,0,0,0,0,0,0,0,0],[-0.60123,-0.35477,0.65722,-0.2841,0,0,0,0,0,0,0,0],[0,0,0,0,-0.47651,-0.15346,0.7128,0.49123,0,0,0,0],[0,0,0,0,-0.60816,-0.27657,0.045725,-0.74267,0,0,0,0],[0,0,0,0,-0.39284,0.91801,-0.048985,-0.023194,0,0,0,0],[0,0,0,0,-0.49876,-0.2392,-0.69816,0.45452,0,0,0,0],[0,0,0,0,0,0,0,0,-0.3562,0.67521,0.33166,-0.55428],[0,0,0,0,0,0,0,0,-0.76357,-0.53993,0.35152,0.043294],[0,0,0,0,0,0,0,0,-0.29425,-0.15109,-0.81203,-0.48084],[0,0,0,0,0,0,0,0,-0.45111,0.47931,-0.32719,0.67801]],"target":[-0.28341,-0.61274,-0.076557,-0.73373,-0.40645,-0.17613,-0.44293,-0.77948,-0.49908,-0.64264,-0.4906,-0.31183],"inputs":[[0,1,2,3],[4,5,6,7],[8,9,10,11]],"outputs":[[0,1,2,3],[4,5,6,7],[8,9,10,11]]},
  {"name":"Flat Sleep","coupling":[[-0.42802,0.048492,-0.90247,0,0,0,0,0,0],[-0.65727,-0.70209,0.274,0,0,0,0,0,0],[-0.62032,0.71044,0.33238,0,0,0,0,0,0],[0,0,0,-0.6658,-0.64446,-0.37601,0,0,0],[0,0,0,-0.55794,0.095436,0.82437,0,0,0],[0,0,0,-0.49539,0.75866,-0.42311,0,0,0],[0,0,0,0,0,0,0.72117,0.30016,0.62435],[0,0,0,0,0,0,0.60306,-0.71556,-0.35256],[0,0,0,0,0,0,0.34093,0.63078,-0.69705]],"target":[-0.52773,-0.14349,-0.83721,-0.67749,-0.30263,-0.67039,-0.99845,-0.055491,-0.0049739],"inputs":[[0,1,2],[3,4,5],[6,7,8]],"outputs":[[0,1,2],[3,4,5],[6,7,8]]},
  {"name":"Befitting Plant","coupling":[[-0.3848,-0.29719,-0.87385],[-0.40534,-0.79615,0.44926],[-0.82923,0.52708,0.18589]],"target":[-0.54667,-0.55993,-0.6226],"inputs":[[0,1],[2],[]],"outputs":[[0,1],[2],[]]},
  {"name":"Noiseless Stone","coupling":[[-0.26099,-0.21208,0.1434,0.93078],[-0.49052,-0.74166,0.29272,-0.35163],[-0.65599,0.63636,0.39347,-0.099567],[-0.51084,0.0033409,-0.85961,-0.010038]],"target":[-0.094034,-0.58035,-0.46131,-0.66449],"inputs":[[0,1],[2],[3]],"outputs":[[0,1],[2],[3]]},
  {"name":"Alert Burst","coupling":[[1,0,0],[0,1,0],[0,0,1]],"target":[-0.778,-0.55733,-0.28999],"inputs":[[0],[1],[2]],"outputs":[[2],[1],[0]]},
  {"name":"Statuesque Name","coupling":[[-0.56636,0.61043,-0.55373,0,0,0,0,0,0],[-0.65701,-0.74004,-0.14382,0,0,0,0,0,0],[-0.49757,0.28235,0.82018,0,0,0,0,0,0],[0,0,0,-0.42301,0.87875,0.22104,0,0,0],[0,0,0,-0.8129,-0.26026,-0.52102,0,0,0],[0,0,0,-0.40032,-0.40008,0.82443,0,0,0],[0,0,0,0,0,0,-0.64827,-0.43741,-0.62323],[0,0,0,0,0,0,-0.48888,-0.3884,0.78111],[0,0,0,0,0,0,-0.58373,0.81106,0.03794]],"target":[-0.62832,-0.7149,-0.30682,-0.16119,-0.91115,-0.37925,-0.89578,-0.055966,-0.44096],"inputs":[[0,1,2],[3,4,5],[6,7,8]],"outputs":[[0,1,2],[3,4,5],[6,7,8]]},
  {"name":"Wide Growth","coupling":[[-1,0,0,0,0,0],[0,-1,0,0,0,0],[0,0,-1,0,0,0],[0,0,0,-1,0,0],[0,0,0,0,1,0],[0,0,0,0,0,-1]],"target":[-0.26358,-0.61106,-0.59286,-0.078192,-0.38175,-0.23194],"inputs":[[0,1],[2,3],[4,5]],"outputs":[[2,4],[0,5],[1,3]]},
  {"name":"Towering Test","coupling":[[1,0,0],[0,1,0],[0,0,-1]],"target":[-0.80613,-0.58649,-0.078684],"inputs":[[0],[1],[2]],"outputs":[[2],[0],[1]]},
  {"name":"Chief Government","coupling":[[1,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0],[0,0,-1,0,0,0,0,0,0,0,0,0],[0,0,0,-1,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,-1,0,0,0,0,0],[0,0,0,0,0,0,0,-1,0,0,0,0],[0,0,0,0,0,0,0,0,-1,0,0,0],[0,0,0,0,0,0,0,0,0,-1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0],[0,0,0,0,0,0,0,0,0,0,0,1]],"target":[-0.57947,-0.58213,-0.27818,-0.49794,-0.32908,-0.50894,-0.34877,-0.71488,-0.84406,-0.14067,-0.51057,-0.084205],"inputs":[[0,1,2,3],[4,5,6,7],[8,9,10,11]],"outputs":[[0,1,2,3],[4,5,6,7],[8,9,10,11]]},
  {"name":"Silky Waste","coupling":[[-0.57941,0.29472,-0.58727,-0.48221,0,0,0,0,0,0,0,0],[-0.69311,-0.66638,0.24115,0.13185,0,0,0,0,0,0,0,0],[-0.21847,0.26791,-0.36113,0.86607,0,0,0,0,0,0,0,0],[-0.36898,0.63032,0.68304,-0.003253,0,0,0,0,0,0,0,0],[0,0,0,0,-0.19151,-0.72771,0.45472,-0.47644,0,0,0,0],[0,0,0,0,-0.5179,-0.30049,-0.7956,-0.092191,0,0,0,0],[0,0,0,0,-0.54205,0.61369,0.18407,-0.54377,0,0,0,0],[0,0,0,0,-0.63347,-0.059447,0.35548,0.6847,0,0,0,0],[0,0,0,0,0,0,0,0,-0.45693,0.035506,0.28006,-0.84351],[0,0,0,0,0,0,0,0,-0.60782,-0.12124,0.58824,0.51946],[0,0,0,0,0,0,0,0,-0.40478,-0.7175,-0.56688,0.00085164],[0,0,0,0,0,0,0,0,-0.50787,0.68501,-0.50417,0.13655]],"target":[-0.75492,-0.32383,-0.30741,-0.48033,-0.036354,-0.75423,-0.1799,-0.63044,-0.17128,-0.8161,-0.25621,-0.48887],"inputs":[[0,1,2,3],[4,5,6,7],[8,9,10,11]],"outputs":[[0,1,2,3],[4,5,6,7],[8,9,10,11]]}
];

var task = tasks[0];
var x = new Array(task.target.length).fill(0);
var is_broadcast = true;

io.on('connection', client => {
  var id = -1;
  client.on('join-admin', name => {
    admin = client;
    admin.emit('broadcast', is_broadcast);
  });
  client.on('join-designer', name => {
    for(i = 0; i < designers.length; i++) {
      if(designers[i] === null) {
        designers[i] = client;
        id = i;
        client.emit('id', id);
        /*
        var target_data = new Array(task.outputs[id].length);
        for(i = 0; i < task.outputs[id].length; i++) {
          target_data[i] = task.target[task.outputs[id][i]];
        }
        */
        client.emit('task', {
          name: task.name,
          target: task.target,
          inputs: task.inputs[id],
          outputs: task.outputs[id]
        });
        return;
      }
    }
    client.emit('id', -1);
  });
  client.on('broadcast', data => {
    is_broadcast = data;
  })
  client.on('task', id => {
    if(tasks[id]) {
      task = tasks[id];
      client.emit('task', task);
      x = new Array(task.target.length).fill(0);
      for(i = 0; i < designers.length; i++) {
        if(designers[i] !== null) {
          designers[i].emit('task', {
            name: task.name,
            target: task.target,
            inputs: task.inputs[i],
            outputs: task.outputs[i]
          });
        }
      }
    }
  });
  client.on('design-x', data => {
    for(i = 0; i < task.inputs[id].length; i++) {
      x[task.inputs[id][i]] = data[i];
    }
    var y = math.multiply(task.coupling, x);
    var solution = math.multiply(math.transpose(task.coupling), task.target);
    if(is_broadcast) {
      io.emit('design-y', y);
    } else {
      client.emit('design-y', y);
      admin.emit('design-y', y);
    }
    /*
    var y_data = new Array(task.outputs[id].length);
    for(i = 0; i < task.outputs[id].length; i++) {
      y_data[i] = y[task.outputs[id][i]];
    }
    socket.emit('design-y', y_data);
    */
  });
  client.on('disconnect', () => {
    designers[id] = null;
  });
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.sendStatus(err.status || 500);
});

module.exports = app;
