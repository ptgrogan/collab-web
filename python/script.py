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
import numpy as np
import os.path
import matplotlib.pyplot as plt
from collab.post_processor import PostProcessor

root = os.path.join('..', 'raw')
session = 'pilot'

pp = PostProcessor()
pp.loadSession(root, session)

# print header
print pp.session.name
print "epsilon = " + '{:3.2f}'.format(pp.session.errTolerance)
print "{0:>3} {1:>3} {2:>3} {3:>3} {4:>10} {5:>10} {6:>10} {7:>10}".format(
    "O", "C/U", "N", "n", "Team (s)", "Red (s)", "Green (s)", "Blue (s)")
# print rows for each task
for task in pp.session.tasks:
    if len(task.problems) == 1:
        print "{0:>3} {1:>3} {2:>3} {3:>3} {4:>10} {5:>10} {6:>10} {7:>10}".format(
            task.order,
            'C' if task.problems[0].isCoupled() else 'U',
            task.problems[0].getProblemSize(),
            task.problems[0].getTeamSize(),
            "{:10.2f}".format(task.problems[0].getElapsedTime(pp.session, task)/1000.),
            '', '', ''
        )
    else:
        print "{0:>3} {1:>3} {2:>3} {3:>3} {4:>10} {5:>10} {6:>10} {7:>10}".format(
            task.order,
            'C' if task.problems[0].isCoupled() else 'U',
            task.problems[0].getProblemSize(),
            task.problems[0].getTeamSize(),
            '',
            "{:10.2f}".format(task.problems[0].getElapsedTime(pp.session, task)/1000.),
            "{:10.2f}".format(task.problems[1].getElapsedTime(pp.session, task)/1000.),
            "{:10.2f}".format(task.problems[2].getElapsedTime(pp.session, task)/1000.)
        )

# post-process example data
task = pp.session.tasks[0]
problem = task.problems[0]
time = [a.getElapsedTime(problem)/1000. for a in problem.actions]
inputs = [a.input for a in problem.actions]
outputs = [a.output for a in problem.actions]
error = [a.getErrorNorm(problem) for a in problem.actions]

# display example plot
plt.figure()
plt.title(task.name)
plt.step(time, error)
plt.xlabel('time (s)')
plt.ylabel('error')

# display example plot
plt.figure()
plt.title(task.name)
plt.step(time, inputs)
plt.xlabel('time (s)')
plt.ylabel('input')

# display example plot
plt.figure()
plt.title(task.name)
plt.step(time, outputs)
plt.gca().set_color_cycle(None) # reset color cycle
plt.plot([min(time), max(time)], [problem.target, problem.target], ls='--')
plt.xlabel('time (s)')
plt.ylabel('output')

# create output directory if not already existing
if not os.path.exists(session):
    os.makedirs(session)

# dump output files
for task in pp.session.tasks:
    for i, problem in enumerate(task.problems):
        with open(os.path.join(session, '_'.join(['p',str(task.order), str(i)])+'.json') , 'wb') as fp:
            json.dump({
                'problem': {
                    'coupling': problem.coupling.tolist(),
                    'target': problem.target.tolist(),
                    'solution': np.round(problem.getSolution(), 2).tolist(),
                    'C/U': 'C' if problem.isCoupled() else 'U',
                    'N': problem.getProblemSize(),
                    'n': problem.getTeamSize(),
                    'actions_total': problem.getNumberActions(),
                    'actions_productive': problem.getNumberProductiveActions(),
                    'actions_switch': problem.getNumberInputSwitches(),
                    'actions_small': problem.getNumberInputsSmall(),
                    'actions_large': problem.getNumberInputsLarge(),
                    'actions_medium': problem.getNumberInputsMedium(),
                    'actions': [
                        {
                            'time': a.time-problem.getInitialTime(),
                            'input': a.input.tolist(),
                            'output': a.output.tolist(),
                            'error': np.round(a.getErrorNorm(problem), 2).tolist()
                        } for a_i, a in enumerate(problem.actions)
                    ]
                }
            }, fp)