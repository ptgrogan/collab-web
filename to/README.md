FEAT Technical Office (TO)
==========================

This project contains an architectural interface specification for the FEAT project. It is organized in two pieces:
 1. FEAT interface library (`feat/`)
 2. Test scripts (`test/`)
 3. Python executables (`bin/`)

The interface library contains Python classes to read/write to JSON files and perform some technical office analysis.

The test directory contains unit test coverage for some analysis capabilities.

The executables perform technical office-specific analyses and generate output files for results.

## Installation

This project was designed for Python 3.7 but should also be compatible with Python 2.7.

To make the `feat` library visible to the Python interpreter from a different directory location, from the project root directory (containing `setup.py`), run:
```shell
pip install -e .
```
where the trailing period (`.`) indicates to install from the current directory.

## Testing

This project includes unit tests with substantial (though not complete) coverage of the interface specification. To run using `nosetests` module, run from the command line:

```shell
python -m nose
```

## Usage

Executable scripts are provided in the `bin/` directory.

For example, using the provided example input file
```json
{
  "example": {
    "width": 10,
    "length": 7
  }
}
```
run
```shell
python bin/example_to.py example-in.json -o example-out.json
```
which should produce the following output file
```json
{
  "example": {
    "area": 70
  }
}
```
