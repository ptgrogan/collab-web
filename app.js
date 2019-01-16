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
          inputs: [...Array(task.inputs[id].length).keys()],
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
