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

from scipy.linalg import orth
import numpy as np

class Session(object):
    """
    An experimental session. Includes settings and the
    list of tasks (training and experimental).
    """
    def __init__(self, name='', num_designers=4, error_tol=0.05, training = [], rounds = []):
        """
        Initializes this session.

        @param name: the session name
        @type name: str

        @param num_designers: the number of designers
        @type num_designers: int

        @param error_tol: the error tolerance for solutions
        @type error_tol: float

        @param training: the training rounds
        @type training: array(Round)

        @param rounds: the experimental rounds
        @type rounds: array(Round)
        """
        self.name = name
        self.num_designers = num_designers
        self.error_tol = error_tol
        self.training = training
        self.rounds = rounds

    @staticmethod
    def generate(seed, errTolerance=0.05):
        random = np.random.RandomState(seed)
        # 2x2 individual: 14s --> 1 min
        # 3x3 individual: 60s --> 2 min
        # 4x4 individual: 132s -->  5 min

        # 2x2 pair: 30s --> 56s --> 1 min
        # 3x3 pair: 168s --> 476s --> 5 min
        # 4x4 pair: 257s --> 350s --> 5 min

        rounds = [
            Round.generate(name='Flat Sleep (Individual)', size=2, assignments=[[0],[1],[2],[3]], random=random),
            Round.generate(name='Economic Motion (Individual)', size=2, assignments=[[0],[1],[2],[3]], random=random),
            Round.generate(name='Unwritten Experience (Individual)', size=3, assignments=[[0],[1],[2],[3]], random=random),
            Round.generate(name='Noiseless Stone (Individual)', size=3, assignments=[[0],[1],[2],[3]], random=random),
            Round.generate(name='Impolite Heat (Individual)', size=4, assignments=[[0],[1],[2],[3]], random=random),
            Round.generate(name='Arrogant Flame (Individual)', size=4, assignments=[[0],[1],[2],[3]], random=random),
            Round.generate(name='Staking System (Pair)', size=2, assignments=[[0,1],[2,3]], random=random),
            Round.generate(name='Towering Test (Pair)', size=2, assignments=[[0,1],[2,3]], random=random),
            Round.generate(name='Thinkable Ink (Pair)', size=2, assignments=[[0,1],[2,3]], random=random),
            Round.generate(name='Better Behavior (Pair)', size=3, assignments=[[0,1],[2,3]], random=random),
            Round.generate(name='Hallowed Sign (Pair)', size=3, assignments=[[1,0],[3,2]], random=random),
            Round.generate(name='Absorbed Copper (Pair)', size=3, assignments=[[1,0],[3,2]], random=random),
            Round.generate(name='Husky Verse (Pair)', size=4, assignments=[[0,1],[2,3]], random=random),
            Round.generate(name='Chief Government (Pair)', size=4, assignments=[[0,1],[2,3]], random=random),
            Round.generate(name='Chemical Rhythm (Pair)', size=4, assignments=[[0,1],[2,3]], random=random)
        ]

        # 'Alert Burst, 'Wistful Act', 'Wide Growth', 'Muddled Reward', 'Brainy Damage',
        # 'Befitting Plant, 'Murky Mass',  'Silky Waste', 'Incompetent Secretary',
        # 'Hard Development', 'Crabby Example', 'Illustrious Balance', 'Statuesque Name', 'Breezy Rain'

        random.shuffle(rounds)

        return Session(
            name = 'experiment{:03d}'.format(seed+1),
            num_designers = 4,
            error_tol = errTolerance,
            training = [
                Round.generate(name='Training Task 1/5 (Individual)', size=1, assignments=[[0],[1],[2],[3]], random=random),
                Round.generate(name='Training Task 2/5 (Individual)', size=2, assignments=[[0],[1],[2],[3]], random=random),
                Round.generate(name='Training Task 3/5 (Pair)', size=2, assignments=[[0,1],[2,3]], random=random),
                Round.generate(name='Training Task 4/5 (Pair)', size=3, assignments=[[0,1],[2,3]], random=random),
                Round.generate(name='Training Task 5/5 (Pair)', size=3, assignments=[[1,0],[3,2]], random=random)
            ],
            rounds = rounds
        )

class Round(object):
    """
    An experimental round with a set of technical tasks.
    """
    def __init__(self, name, assignments, tasks):
        """
        Initializes this round.

        @param name: the name
        @type name: str

        @param assignments: the task assignments: list of lists of designers
        @type assignments: list(list(int))

        @param tasks: the technical tasks
        @type array(Task)
        """
        self.name = name
        self.assignments = assignments
        self.tasks = tasks

        # self.time = 0 # set by post-processor
        # self.completionTime = 0 # set by post-processor

    @staticmethod
    def generate(name, size, assignments, is_coupled=True, random=np.random):
        return Round(
            name = name,
            assignments = assignments,
            tasks = [Task.generate(designers, size, is_coupled=is_coupled, random=random) for designers in assignments]
        )

class Task(object):
    """
    An experimental task.
    """
    def __init__(self, designers, num_inputs, num_outputs, coupling, target, inputs, outputs):
        """
        Initializes this task.

        @param designers: the designers asigned to this problem
        @type designers: list(int)

        @param num_inputs: the number of inputs per designer
        @type num_inputs: list(int)

        @param num_outputs: the number of outputs per designer
        @type num_outputs: list(int)

        @param coupling: the coupling matrix (M)
        @type coupling: list(float)

        @param target: the target vector (y_star)
        @type target: list(float)

        @param inputs: the input assignments
        @type inputs: list(int)

        @param outputs: the output assignments
        @type outputs: list(int)
        """
        self.designers = designers
        self.num_inputs = num_inputs
        self.num_outputs = num_outputs
        self.coupling = coupling
        self.target = target
        self.inputs = inputs
        self.outputs = outputs

        # self.actions = [] # set by post-processor

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
        return np.dot(np.array(self.coupling).T, self.target)

    @staticmethod
    def generate(designers, size, inputs=None, outputs=None, is_coupled=True, random=np.random):
        if inputs is None:
            # try to assign equally among designers
            inputs = [designers[int(i//(size/len(designers)))] for i in range(size)]
        num_inputs = [np.sum(np.array(inputs) == designer).item() for designer in designers];
        if outputs is None:
            # try to assign equally among designers
            outputs = [designers[int(i//(size/len(designers)))] for i in range(size)]
        num_outputs = [np.sum(np.array(outputs) == designer).item() for designer in designers];

        coupling = np.zeros((size, size))
        if is_coupled:
            # coupling matrix is orthonormal basis of random matrix
            coupling = orth(random.rand(size, size))
        else:
            # coupling matrix has random 1/-1 along diagonal
            coupling = np.diag(np.round(2*random.rand(size)-1))

        # find a target with no solution values "close" to initial condition
        solution = np.zeros(size)
        while np.any(np.abs(solution) <= 0.20):
            target = orth(2*random.rand(size,1)-1)
            # solve using dot product of coupling transpose and target
            solution = np.dot(coupling.T, target)

        return Task(designers, num_inputs, num_outputs, coupling.tolist(), target[:,0].tolist(), inputs, outputs)

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
        return all(abs(e) < session.errTolerance
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
