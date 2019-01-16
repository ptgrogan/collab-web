var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var math = require('mathjs');

var app = express();
var server = require('http').createServer(app);
app.set('port', 3000);
server.listen(3000);
var io = require('socket.io')(server);

var designers = [null, null, null];
/*
var task = {
  name: "Training #3 (Individual)",
  target: [-0.99953,-0.030564,-0.87647,-0.48146,-0.88038,-0.47426],
  inputs: [[0,1],[2,3],[4,5]],
  outputs: [[0,1],[2,3],[4,5]],
  coupling: [[-0.75135,-0.6599,0,0,0,0],[-0.6599,0.75135,0,0,0,0],[0,0,-0.46121,-0.88729,0,0],[0,0,-0.88729,0.46121,0,0],[0,0,0,0,-0.56289,-0.82653],[0,0,0,0,-0.82653,0.56289]]
};
var task = {
  name: "Flat Sleep (Individual)",
  coupling: [[-0.42802,0.048492,-0.90247,0,0,0,0,0,0],[-0.65727,-0.70209,0.274,0,0,0,0,0,0],[-0.62032,0.71044,0.33238,0,0,0,0,0,0],[0,0,0,-0.6658,-0.64446,-0.37601,0,0,0],[0,0,0,-0.55794,0.095436,0.82437,0,0,0],[0,0,0,-0.49539,0.75866,-0.42311,0,0,0],[0,0,0,0,0,0,0.72117,0.30016,0.62435],[0,0,0,0,0,0,0.60306,-0.71556,-0.35256],[0,0,0,0,0,0,0.34093,0.63078,-0.69705]],
  target: [-0.52773,-0.14349,-0.83721,-0.67749,-0.30263,-0.67039,-0.99845,-0.055491,-0.0049739],
  inputs: [[0,1,2],[3,4,5],[6,7,8]],
  outputs: [[0,1,2],[3,4,5],[6,7,8]]
}
*/
var task = {
  name: "Training #5 (Team)",
  coupling: [[-0.39515,0.30872,-0.86519],[-0.52949,-0.84618,-0.060114],[-0.75067,0.43435,0.49783]],
  target: [-0.17382,-0.58867,-0.78947],
  inputs: [[0],[1],[2]],
  outputs: [[0],[1],[2]]
};
var x = new Array(task.target.length).fill(0);

io.on('connection', client => {
  var id = -1;
  client.on('join-designer', name => {
    for(i = 0; i < designers.length; i++) {
      if(designers[i] === null) {
        designers[i] = name;
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
  client.on('design-x', data => {
    for(i = 0; i < task.inputs[id].length; i++) {
      x[task.inputs[id][i]] = data[i];
    }
    var y = math.multiply(task.coupling, x);
    var solution = math.multiply(math.transpose(task.coupling), task.target);
    io.emit('design-y', y);
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
