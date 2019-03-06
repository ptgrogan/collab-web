import feat

import argparse
import json

def execute(infile, outfile=None):
    """Executes the example technical office analysis.

    Args:
        infile: The file containing the input JSON document.

    Kwargs:
        outfile: The output file to write analysis results (default None).
            If None, analysis results will be printed to console.
    Raises:
        KeyError: The input file is missing dictionary keys for
            `example.width` and/or `example.length`.
    """
    # load the input file from JSON
    input_dict = json.load(infile)
    # build the example data object
    example = feat.Example(
        width = input_dict['example']['width'],
        length = input_dict['example']['length']
    )
    # build the example analysis output dict
    output_dict = {
        'example': {
            'area': example.area()
        }
    }
    if outfile is not None:
        # dump the output dict to file
        json.dump(output_dict, outfile, indent=2)
    else:
        # print the output dict to console
        print(json.dumps(output_dict, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Example Technical Office (TO) Analysis'
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
