"""
Copyright 2019 Paul T. Grogan, Stevens Institute of Technology

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

from .model import Session, Problem, Task, Action

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
                          session["errTolerance"])
            map(self.session.tasks.remove,
                [task for task in self.session.tasks if task.order in session["omittedTasks"]])

    def loadFile(self, jsonFile, logFile, errTolerance = 0.05):
        """
        Loads experimental results from file.

        @param jsonFile: the experimental json file
        @type jsonFile: str

        @param logFile: the experimental log file
        @type logFile: str

        @param errTolerance: the error tolerance
        @type errTolerance: float
        """

        # parse json file to instantiate experiments, tasks, and problems
        with open(jsonFile) as jsonData:
            session = json.load(jsonData)
            self.session = Session(
                name = session["name"],
                errTolerance = session["errTolerance"]
                if "errTolerance" in session else errTolerance,
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
