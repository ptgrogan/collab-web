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
import numpy as np

from collab import Session, Round

for seed in range(10):
    random = np.random.RandomState(seed)
    # 2x2 individual: 14s --> 1 min
    # 3x3 individual: 60s --> 2 min
    # 4x4 individual: 132s -->  5 min

    # 2x2 pair: 30s --> 56s --> 1 min
    # 3x3 pair: 168s --> 476s --> 5 min
    # 4x4 pair: 257s --> 350s --> 5 min
    training = [
        Round.generate(name='Training Task 1/5 (Individual)', size=1, assignments=[[0],[1],[2],[3]], random=random),
        Round.generate(name='Training Task 2/5 (Individual)', size=2, assignments=[[0],[1],[2],[3]], random=random),
        Round.generate(name='Training Task 3/5 (Pair)', size=2, assignments=[[0,1],[2,3]], random=random),
        Round.generate(name='Training Task 4/5 (Pair)', size=3, assignments=[[0,1],[2,3]], random=random),
        Round.generate(name='Training Task 5/5 (Pair)', size=3, assignments=[[1,0],[3,2]], random=random)
    ]
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
        #Round.generate(name='Absorbed Copper (Pair)', size=3, assignments=[[1,0],[3,2]], random=random),
        Round.generate(name='Husky Verse (Pair)', size=4, assignments=[[0,1],[2,3]], random=random),
        Round.generate(name='Chief Government (Pair)', size=4, assignments=[[0,1],[2,3]], random=random),
        #Round.generate(name='Chemical Rhythm (Pair)', size=4, assignments=[[0,1],[2,3]], random=random)
    ]

    # 'Alert Burst, 'Wistful Act', 'Wide Growth', 'Muddled Reward', 'Brainy Damage',
    # 'Befitting Plant, 'Murky Mass',  'Silky Waste', 'Incompetent Secretary',
    # 'Hard Development', 'Crabby Example', 'Illustrious Balance', 'Statuesque Name', 'Breezy Rain'

    # shuffle rounds until there are no size=4 tasks in first half of session
    while any(sum(rounds[i].tasks[0].num_inputs) == 4 for i in range(0, len(rounds)//2)):
        random.shuffle(rounds)

    session = Session(
        name = 'experiment{:03d}'.format(seed+1),
        num_designers = 4,
        error_tol = 0.05,
        training = training,
        rounds = rounds
    )

    with open('experiment{:03d}.json'.format(seed+1), 'w') as out_file:
        json.dump(session, out_file, default=lambda o: o.__dict__)
