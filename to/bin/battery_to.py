# -*- coding: utf-8 -*-
"""
Created on Wed Mar  6 17:52:41 2019

@author: jlaughla
"""
import feat

import argparse
import json

def execute(infile, outfile=None):
    '''Executes the battery technical office analysis
    
    Args:
        infile: the file containing the input JSON document
        
    Kwargs:
        outfile: The output file to write analysis results (default None).
            If None, analysis results will be printed to console.
    Raises:
        KeyError: The input file is missing dictionary keys for
            `example_battery.width` and/or `example_battery.length`.
    '''
    
    # load the input file from JSON
    input_dict = json.load(infile)
    # build the example data object
    
    example_battery = feat.Example(
        number_cell = input_dict['number_cell'],
        energy_cell = input_dict['energy_cell'],
        payload_mass = input_dict['payload_mass'],
        x_location = input_dict['x_location']
    )
    
    # build the example analysis output dict
    output_dict = {
        'battery_out': {
            'energy_available': example_battery.energy(),
            'total_payload_mass': example_battery.mass()
        }
    }
    if outfile is not None:
        # dump to the output dict to file
        json.dump(output_dict, outfile, indent = 2)
    else:
        # print the output dict to console
        print(json.dumps(output_dict, indent = 2))
        
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Battery Technical Office (TO) Analysis'
    )
    parser.add_argument(
        'infile',
        type = argparse.FileType('r'),
        help = 'Design input JSON file'
    )
    parser.add_argument(
        '-o',
        '--outfile',
        type = argparse.FileType('w'),
        help = 'Write analysis output to specified JSON file'
    )
    args = parser.parse_args()
    execute(args.infile, args.outfile)
