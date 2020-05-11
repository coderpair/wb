# WB

WB is an online collaborative whiteboard focusing primarily on the needs of online teachers/students


This board is an extension of the [lovasoa/whitebophir](https://github.com/lovasoa/whitebophir) project.

A demonstration server is available at [lcfprep.com/wb2/wb.html](https://lcfprep.com/wb2/wb.html)

## Screenshots

The WB whiteboard:

<img width="861" alt="Screen Shot 2020-04-15 at 12 50 19 AM" src="https://user-images.githubusercontent.com/8367977/81508360-83bc1280-92b8-11ea-86c0-c30a408e7ee3.png">

Some drawings from the original board:
<table>
 <tr>
  <td> The <i><a href="https://wbo.ophir.dev/boards/anonymous">anonymous</a></i> board
  <td> <img width="300" src="https://user-images.githubusercontent.com/552629/59885574-06e02b80-93bc-11e9-9150-0670a1c5d4f3.png">
  <td> collaborative diagram editing
  <td> <img alt="Screenshot of WBO's user interface: architecture" width="300" src="https://user-images.githubusercontent.com/552629/59915054-07101380-941c-11e9-97c9-4980f50d302a.png" />
  
  <tr>
   <td> teaching math on <b>WBO</b>
   <td> <img alt=wbo teaching" width="300" src="https://user-images.githubusercontent.com/552629/59915737-a386e580-941d-11e9-81ff-db9e37f140db.png" />
   <td> drawing art
   <td> <img alt="angel drawn on WBO" width="300" src="https://user-images.githubusercontent.com/552629/59914139-08404100-941a-11e9-9c29-bd2569fe4730.png"/>
</table>

## Running your own instance of WB

If you have your own web server, and want to run a private instance of WB on it, you can. It should be very easy to get it running on your own server.

### Running the code using NPM



First [install node.js](https://nodejs.org/en/download/) (v8.0 or superior)
 if you don't have it already, then install WB:

```
npm install wb-rdbeach
```

Finally, you can start the server:

```
PORT=8080 npm start
```

This will run WB directly on your machine, on port 8080, without any isolation from the other services.

Open the browser on your local machine and type:

```
http://localhost:8080
```
To access the board.


If you want to run on a different port, you will need to change the PORT=8080 in the line above, and modify this line in /client-data/js/board.js:

```
this.socket = io.connect(':8080', {
```

By default, the application runs its own web server and socket server at the root directory, listening to port 8080. If you want to incorporate the whiteboard in an existing site, simply move the client-data directory to a subfolder of your site and point your browser toward the index.html or board.html file located within this directory.


If you want to run the board from an https site. You will need to update the following paths in /server/configuration.js

```
    PRIVATE_KEY_PATH:  "../../../../ssl/private.key",

    CERTIFICATE_PATH: "../../../../ssl/certificate.crt",

    CA_BUNDLE_PATH: "../../../../ssl/ca_bundle.crt",
```

And start the server with:

```
PORT=8080 HTTPS=true npm start
```

## Troubleshooting

If you experience an issue or want to propose a new feature in WB, please [open a github issue](https://github.com/rdbeach/wb/issues/new).
