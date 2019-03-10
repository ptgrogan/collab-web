"""
Copyright 2016 Paul T. Grogan, Stevens Institute of Technology

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import json
import os.path
import re
import numpy as np

class PostProcessor(object):
    """
    Performs post-processing functions on experimental data.
    """
    def __init__(self):
        """
        Initializes this post-processor.
        """
        self.session = None
        
    def loadSession(self, rootPath, sessionName):
        """
        Loads experimental results from a configured session.
        
        @param rootPath: the file path root
        @type rootPath: str
        
        @param sessionName: the session name
        @type sessionName: str
        """
        with open(os.path.join(rootPath, 'config.json')) as configData:
            config = json.load(configData)
            session = next(s for s in config["sessions"] if s["name"] == sessionName)
            self.loadFile(os.path.join(rootPath, sessionName, session["jsonFile"]),
                          os.path.join(rootPath, sessionName, session["logFile"]),
                          session["errTolerance"],
                          session["numTolerance"])
            map(self.session.tasks.remove,
                [task for task in self.session.tasks if task.order in session["omittedTasks"]])
        
    def loadFile(self, jsonFile, logFile, errTolerance = 0.05, numTolerance = 0.000):
        """
        Loads experimental results from file.
        
        @param jsonFile: the experimental json file
        @type jsonFile: str
        
        @param logFile: the experimental log file
        @type logFile: str
        
        @param errTolerance: the error tolerance
        @type errTolerance: float
        
        @param numTolerance: the numerical tolerance
        @type numTolerance: float
        """
        
        # parse json file to instantiate experiments, tasks, and problems
        with open(jsonFile) as jsonData:
            session = json.load(jsonData)
            self.session = Session(
                name = session["name"],
                errTolerance = session["errTolerance"]
                if "errTolerance" in session else errTolerance,
                numTolerance = session["numTolerance"]
                if "numTolerance" in session else numTolerance,
                trainingTasks = map(lambda t: Task.parse(t[0], t[1]),
                                    zip(session["trainingModels"],
                                        range(1, 1 + len(session["trainingModels"])))),
                tasks = map(lambda t: Task.parse(t[0], t[1]),
                            zip(session["experimentModels"],
                                range(1, 1 + len(session["experimentModels"]))))
            )
        
        # parse log file to instantiate actions
        with open(logFile) as logData:
            task = None
            # iterate over each line in log
            for line in logData.read().splitlines():
                # parse time, type, and content fields
                data = line.split(',')
                time = long(data[0])
                type = data[1]
                content = data[2]
                
                # handle opened event: check for session match
                if type == 'opened':
                    if content != self.session.name:
                        raise Exception('Mis-matched sessions ({}, {}).'.format(
                            content, self.session.name))
                # handle initialized event: append initial action to corresponding task
                elif type == 'initialized':
                    # parse the name and target values
                    result = re.match('name="(?P<name>.+)"; target={(?P<target>.+)}', content)
                    if result:
                        name = result.group('name')
                        # find the task problem which matches the name
                        task = next((t for t in self.session.trainingTasks + self.session.tasks
                                     if t.name == name))
                        if task is None:
                            raise Exception('Missing task ({}).'.format(name))
                        # set task time
                        task.time = time
                        
                        for problem in task.problems:
                            # append an action with initial inputs and outputs
                            problem.actions.append(Action(
                                time = time,
                                input = np.zeros(len(problem.target)),
                                output = np.zeros(len(problem.target))
                            ))
                # handle updated event: append new action to corresponding task
                elif type == 'updated':
                    if task is None:
                        raise Exception('Task not initialized.')
                    # parse the input and output values
                    result = re.match('input={(?P<input>.+)}; output={(?P<output>.+)}', content)
                    if result:
                        inputs = np.array(map(float, result.group('input').split(';')))
                        outputs = np.array(map(float, result.group('output').split(';')))
                        
                        for problem in task.problems:
                            input = inputs[np.array([i in problem.designers
                                                     for i in task.inputs])]
                            output = outputs[np.array([o in problem.designers
                                                       for o in task.outputs])]
                            # skip actions with no change in inputs
                            if not np.array_equal(input, problem.actions[-1].input):
                                problem.actions.append(Action(
                                    time = time,
                                    input = input,
                                    output = output
                                ))
                # handle solved event: reset task
                elif type == 'solved':
                    # log completion time and reset task
                    task.completionTime = time
                    task = None

class Session(object):
    """
    An experimental session. Includes settings and the
    list of tasks (training and experimental).
    """
    def __init__(self, name='', errTolerance=0.05, numTolerance=0.0,
                 trainingTasks = [], tasks = []):
        """
        Initializes this session.
        
        @param name: the session name
        @type name: str
        
        @param errTolerance: the error tolerance for solutions
        @type errTolerance: float
        
        @param numTolerance: the numerical tolerance for solution checking
        @type numTolerance: float
        
        @param trainingTasks: the training tasks
        @type trainingTasks: array(Task)
        
        @param tasks: the experimental tasks
        @type tasks: array(Task)
        """
        self.name = name
        self.errTolerance = errTolerance
        self.numTolerance = numTolerance
        self.trainingTasks = trainingTasks
        self.tasks = tasks
    

class Task(object):
    """
    An experimental task with a set of technical problems.
    """
    def __init__(self, name, coupling, target, inputs, outputs,
                 inputLabels, outputLabels, problems, order):
        """
        Initializes this task.
        
        @param name: the name
        @type name: str
        
        @param coupling: the coupling matrix (M)
        @type coupling: numpy.Matrix(float)
        
        @param target: the target vector (y_star)
        @type target: numpy.Array(float)
        
        @param inputs: the input assignments
        @type inputs: numpy.Array(int)
        
        @param outputs: the output assignments
        @type outputs: numpy.Array(int)
        
        @param inputLabels: the input labels
        @type inputLabels: numpy.Array(string)
        
        @param outputLabels: the output labels
        @type outputLabels: numpy.Array(string)
        
        @param problems: the technical problems
        @type array(Problem)
        
        @param order: the experimental order
        @type order: int
        """
        self.name = name
        self.coupling = coupling
        self.target = target
        self.inputs = inputs
        self.outputs = outputs
        self.inputLabels = inputLabels
        self.outputLabels = outputLabels
        self.problems = problems
        self.order = order
        
        self.time = 0 # set by experimental log
        self.completionTime = 0 # set by experimental log
            
    @staticmethod
    def parse(json, order):
        """
        Parses a Task from json data.
        
        @param json: the json data
        @type json: dict
        
        @param order: the task order
        @type order: int
        """
        
        # get the task name
        name = json["name"]
        
        # get composite coupling matrix
        coupling = np.matrix(json["couplingMatrix"])
        
        # get composite target vector
        target = np.array(json["targetVector"])
        
        # generate default input labels if missing
        inputLabels = np.array(
            json["inputLabels"] if "inputLabels" in json
            else map(lambda i: 'x_'+str(i),
                     range(1, 1 + len(json["targetVector"])))
        )
        
        # generate default output labels if missing
        outputLabels = np.array(
            json["outputLabels"] if "outputLabels" in json
            else map(lambda i: 'y_'+str(i),
                     range(1, 1 + len(json["targetVector"])))
        )
        
        # parse input assignments from input indices:
        # for each designer's list of assigned indices
        # add that designer's index to corresponding input assignment
        inputs = np.zeros(len(inputLabels))
        for designer, indices  in enumerate(json["inputIndices"]):
            for index in indices:
                inputs[index] = designer
        
        # parse output assignments from output indices:
        # for each designer's list of assigned indices
        # add that designer's index to the corresponding output assignment
        outputs = np.zeros(len(outputLabels))
        for designer, indices in enumerate(json["outputIndices"]):
            for index in indices:
                outputs[index] = designer
        
        # get list of designers with assigned inputs or outputs
        designers = np.unique(np.concatenate((inputs, outputs)))
        
        if 'Individual' in name:
            problems = []
            for designer in designers:
                problems.append(
                    # create filtered problem
                    Problem(
                        designers = designers[designers==designer],
                        coupling = coupling[inputs==designer,:][:,outputs==designer],
                        target = target[outputs==designer],
                        inputs = inputs[inputs==designer],
                        outputs = outputs[outputs==designer],
                        inputLabels = inputLabels[inputs==designer],
                        outputLabels = outputLabels[outputs==designer]
                    )
                )
        else:
            problems = [
                # create single problem
                Problem(
                    designers = designers,
                    coupling = coupling,
                    target = target,
                    inputs = inputs,
                    outputs = outputs,
                    inputLabels = inputLabels,
                    outputLabels = outputLabels
                )
            ]
        
        return Task(
            name = name,
            coupling = coupling,
            target = target,
            inputs = inputs,
            outputs = outputs,
            inputLabels = inputLabels,
            outputLabels = outputLabels,
            problems = problems,
            order = order
        )

class Problem(object):
    """
    A tasked problem.
    """
    def __init__(self, designers, coupling, target, inputs, outputs,
                 inputLabels, outputLabels):
        """
        Initializes this problem.
        
        @param designers: the designers asigned to this problem
        @type designers: numpy.Array(int)
        
        @param coupling: the coupling matrix (M)
        @type coupling: numpy.Matrix(float)
        
        @param target: the target vector (y_star)
        @type target: numpy.Array(float)
        
        @param inputs: the input assignments
        @type inputs: numpy.Array(int)
        
        @param outputs: the output assignments
        @type outputs: numpy.Array(int)
        
        @param inputLabels: the input labels
        @type inputLabels: numpy.Array(string)
        
        @param outputLabels: the output labels
        @type outputLabels: numpy.Array(string)
        """
        self.designers = designers
        self.coupling = coupling
        self.target = target
        self.inputs = inputs
        self.outputs = outputs
        self.inputLabels = inputLabels
        self.outputLabels = outputLabels
        
        self.actions = [] # set by experimental log
    
    def isCoupled(self):
        """
        Checks if this problem is coupled.
        
        @return true, if this problem is coupled
        @rtype bool
        """
        # check if coupling matrix is not equal to its diagonal elements
        return not np.array_equal(
            np.diag(np.diag(self.coupling)),
            self.coupling
        )
        
    def getTeamSize(self):
        """
        Gets the team size for this problem.
        
        @return the number of team members
        @rtype int
        """
        return len(self.designers)
    
    def getProblemSize(self):
        """
        Gets the problem size for this problem.
        
        @return the number of inputs and outputs
        @rtype int
        """
        return max(len(self.inputs), len(self.outputs))
    
    def getInitialTime(self):
        """
        Gets the initial time (time of first action) for this task.
        
        @returns: the initial time (milliseconds)
        @rtype: long
        """
        # return initial time for first action with non-zero inputs
        initialAction = next(a for a in self.actions
                             if any(i != 0 for i in a.getInput(self)))
        return initialAction.time
    
    def getCompletionTime(self, session, task):
        """
        Gets the completion time (time of last action) for this task.
        
        @param session: the experimental session
        @type session: Session
        
        @param task: the task
        @type task: Task
        
        @returns: the completion time (milliseconds)
        @rtype: long
        """
        # by default, the task is complete at the first action solving the task
        if any(a.isSolved(session, self) for a in self.actions):
            completingAction = next(a for a in self.actions
                               if a.isSolved(session, self))
            return completingAction.time
        # however, sometimes the "solution" is missed due to numerical issues
        elif task.completionTime > 0:
            return self.actions[-1].time
        # otherwise fail gracefully
        else:
            return self.getInitialTime() - 1000
    
    def getNumberActions(self):
        """
        Gets the number of actions for this task.
        
        @returns: the number of actions
        @rtype: int
        """
        return sum([1 if a_i > 0 and not np.array_equal(a.input, self.actions[a_i-1].input) else 0
                    for a_i, a in enumerate(self.actions)])
    
    def getNumberProductiveActions(self):
        """
        Gets the number of productive actions (error-reducing) for this task.
        
        @returns: the number of productive actions
        @rtype: int
        """
        return sum([1 if a_i > 0 and a.getErrorNorm(self) < self.actions[a_i-1].getErrorNorm(self) else 0
                    for a_i, a in enumerate(self.actions)])
    
    def getNumberInputSwitches(self):
        """
        Gets the number of input switches (different modified input) for this task.
        
        @returns: the number of input switches
        @rtype: int
        """
        inputModified = [[i_i for i_i, i in enumerate(self.actions[a_i].input)
                          if i != self.actions[a_i-1].input[i_i]][0] if a_i > 0 else 0
            for a_i, a in enumerate(self.actions)]
        return sum([1 if i_i > 0 and i != inputModified[i_i-1] else 0
                    for i_i, i in enumerate(inputModified)])
    
    
    def getNumberInputsSmall(self):
        """
        Gets the number of actions with small input changes (arrow up/down keys?).
        
        @returns: the number of inputs with small changes
        @rtype: int
        """
        return sum([1 if a_i > 0 and np.linalg.norm(a.input - self.actions[a_i-1].input) < 0.05 else 0
                    for a_i, a in enumerate(self.actions)])
    
    def getNumberInputsLarge(self):
        """
        Gets the number of actions with large input changes (mouse?).
        
        @returns: the number of inputs with large changes
        @rtype: int
        """
        return sum([1 if a_i > 0 and np.linalg.norm(a.input - self.actions[a_i-1].input) > 0.25 else 0
                    for a_i, a in enumerate(self.actions)])
    
    def getNumberInputsMedium(self):
        """
        Gets the number of actions with medium input changes (page up/down keys?).
        
        @returns: the number of inputs with medium changes
        @rtype: int
        """
        return sum([1 if a_i > 0 and np.linalg.norm(a.input - self.actions[a_i-1].input) >= 0.05
                    and np.linalg.norm(a.input - self.actions[a_i-1].input) <= 0.25 else 0
                    for a_i, a in enumerate(self.actions)])
    
    def getElapsedTime(self, session, task):
        """
        Gets the elapsed time (duration) for this task.
        
        @param session: the experimental session
        @type session: Session
        
        @param task: the task
        @type task: Task
        
        @returns: the elapsed time (milliseconds)
        @rtype: long
        """
        return self.getCompletionTime(session, task) - self.getInitialTime()
    
    def getSolution(self):
        """
        Gets the zero-error solution for this task.
        
        @returns: the solution vector
        @rtype numpy.Array(float)
        """
        return np.dot(self.coupling.T, self.target)

class Action(object):
    """
    An experimental action.
    """
    def __init__(self, time = 0, input = np.array([]), output = np.array([])):
        """
        Initializes this action.
        
        @param time: the action time (milliseconds)
        @type time: long
        
        @param input: the resulting input vector
        @type input: np.Array(float)
        
        @param output: the resulting output vector
        @type output: np.Array(float)
        """
        self.time = time
        self.input = input
        self.output = output
    
    def getError(self, problem, designer = None):
        """
        Gets the error in design after this action for a problem.
        
        @param problem: the problem
        @type problem: Problem
        
        @param designer: the designer (optional, default = None)
        @type designer: int
        
        @returns: the error
        @rtype: numpy.Array(float)
        """
        # compute error as outputs - targets
        if designer is None:
            return self.output - problem.target
        else:
            return (self.output[problem.outputs == designer]
                    - problem.target[problem.outputs == designer])
            
    def getErrorNorm(self, problem, designer = None):
        """
        Gets the error norm in design after this action for a problem.
        
        @param problem: the problem
        @type problem: Problem
        
        @param designer: the designer (optional, default = None)
        @type designer: int
        
        @returns: the error norm
        @rtype: float
        """
        # compute 2-norm of error
        return np.linalg.norm(self.getError(problem, designer))
    
    def getElapsedTime(self, problem):
        """
        Gets the elapsed time of this action.
        
        @param problem: the problem
        @type problem: Problem
        
        @returns: the elapsed time (milliseconds)
        @rtype: long
        """
        return self.time - problem.getInitialTime()
    
    def isSolved(self, session, problem):
        """
        Checks if the problem is solved.
        
        @param session: the experimental session
        @type session: Session
        
        @param problem: the problem
        @type problem: Problem
        
        @returns: true, if this action solves the task
        @rtype: bool
        """
        # all errors must be less than tolerance values
        return all(abs(e) < session.errTolerance + session.numTolerance
                   for e in self.getError(problem))
    
    def getInput(self, problem, designer = None):
        """
        Gets the input for a designer.
        
        @param problem: the problem
        @type problem: Problem
        
        @param designer: the designer (optional, default = None)
        @type designer: int
        
        @returns: the input vector
        @rtype: numpy.Array(float)
        """
        if designer is None:
            return self.input
        else:
            return self.input[problem.inputs == designer]
    
    def getOutput(self, problem, designer = None):
        """
        Gets the output for a designer.
        
        @param problem: the problem
        @type problem: Problem
        
        @param designer: the designer (optional, default = None)
        @type designer: int
        
        @returns: the output vector
        @rtype: numpy.Array(float)
        """
        if designer is None:
            return self.output
        else:
            return self.output[problem.outputs == designer]