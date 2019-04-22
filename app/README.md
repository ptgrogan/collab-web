# Collaborative Design Web Platform: Application

## Introduction

This software runs a distributed design experiment with a server (administrator) and clients (designers). Following an experimental session generated from the Python toolkit, the server records all user actions in log files for post-processing.

## Pre-requisites

This software is written in JavaScript and either requires Node.js on the server-side application or Docker to run the container. The clients require web browsers with standard HTML/CSS/JavaScript capabilities.

Before running, make sure to run the generator script to populate required experiment files.

## Usage

This package can be used in two ways: either as a Docker image or as a standalone application. In either case, the log files will be written to the `log` directory in the project root.

### Standalone Application

Using this application as a standalone service requires [Node.js](https://nodejs.org/) and native build tools. On Linux platforms, the following libraries are required: `nodejs`. On Windows platforms, download and install from [https://nodejs.org/en/](https://nodejs.org/en/).

Once the native dependencies are installed, install dependent libraries using the following command (from this directory):
```shell
npm install
```
Then initialize the application with the following command:

```shell
npm start
```
The application will launch with a primary entry point of port 80:

* [http://localhost:80](http://localhost:80): designer interface
* [http://localhost:80/admin.html](http://localhost:80/admin.html): administrator interface

Be aware that firewall and security settings must be configured to allow clients to access the server via a publicly-available IP address.

### Docker Image

Using this application as a container requires [Docker](https://www.docker.com/) which will conveniently manage all other dependencies for the project.

Build a Docker image using the following command (from this directory):
```shell
docker build -t collab-web .
```
After the image is built, you can run the image using the following command:
```shell
docker run -p 80:80 --mount type=bind,src=/abs/path/to/your/log,dst=/usr/app/log collab-web
```
Where `-p 80:80` tells Docker to map local port 80 to application port 80 (which is not normally externally accessible) and `--mount type=bind,src=/abs/path/to/your/log,dst=/usr/app/log` tells Docker to redirect server log files to the (local) log directory specified as an absolute path (note: on Windows you may have to enable drive sharing in the Docker settings). The application will launch with a primary entry point of port 80:

* [http://localhost:80](http://localhost:80): designer interface
* [http://localhost:80/admin.html](http://localhost:80/admin.html): administrator interface

Be aware that firewall and security settings must be configured to allow clients to access the server via a publicly-available IP address.

To stop the application, run:
```shell
docker ps
```
to get the container ID and
```shell
docker container stop <container_id>
```
to stop the container.

## References

Grogan, P.T. and O.L. de Weck (2016). "Collaboration and complexity: an experiment on the effect of multi-actor coupled design," *Research in Engineering Design*, Vol. 27, No. 3, pp. 221-235. [Online](http://link.springer.com/article/10.1007%2Fs00163-016-0214-7).

Alelyani, T., Y. Yang, and P.T. Grogan (2017). "Understanding Designers Behavior in Parameter Design Activities" *2017 ASME International Design Engineering Technical Conferences and Computers and Information in Engineering Conference*, August 6-9, Cleveland, Ohio. [Online](http://proceedings.asmedigitalcollection.asme.org/proceeding.aspx?articleid=2662424)

Grogan, P.T. (2018). "Data on Multi-actor Parameter Design Tasks by Engineering Students with Variable Problem Size, Coupling, and Team Size," *Data in Brief*, Vol. 20, pp. 1079-1084. [Online](https://doi.org/10.1016/j.dib.2018.08.162)

## License

Copyright 2019 Paul T. Grogan

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
