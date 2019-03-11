# collab-web

Collaborative design web interface.

This package can be used in two ways: either as a docker image or as a standalone application.

### Docker Image

Using this application as a container requires [Docker](https://www.docker.com/).

Build a Docker image using the following command (from this directory):
```shell
docker build -t app .
```
After the image is built, you can run the image using the following command:
```shell
docker run -p 80:80 app
```
Where the 80:80 tells Docker to map local port 80 to application port 80 (which is not normally externally accessible). The application will launch with a primary entry point of port 80:

 * [http://localhost:80](http://localhost:80): designer interface
 * [http://localhost:80/admin.html](http://localhost:80/admin.html): administrator interface

To stop the application, run:
 ```shell
 docker ps
 ```
 to get the container ID and
 ```shell
 docker container stop <container_id>
 ```
 to stop the container.

### Standalone Application

Using this application as a standalone service requires [Node.js](https://nodejs.org/) and native build tools. On Linux platforms, the following libraries are required:

``nodejs``

On Windows platforms, download and install from [https://nodejs.org/en/](https://nodejs.org/en/).

Once the native dependencies are installed, install dependent libraries using the following command (from this directory):

``npm install``

Then initialize the application with the following command:

``npm start``

The application will launch with a primary entry point of port 80:

 * [http://localhost:80](http://localhost:80)
