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
    
    
## User Guide ##

![Wb Layout New](https://user-images.githubusercontent.com/8367977/81897735-16380c80-956c-11ea-8eff-356fdb3a410d.png)

### Removal tools ###

The pink skull eraser erases one drawing element at a time. Simply click on the element to delete it. 

The black skull eraser erases multiple elements at once. Click and drag across a rectangular area to erase all drawing elements within that area. The black eraser will only erase elements which are fully contained within the rectangle.

The masking eraser, located in the additional tools slider, may be used to make slight corrections to a drawing. It should not be used to erase large areas of the board.

### Transform tool ###

The transform tool allows you to move, rotate, and resize objects. The first variant is the single element transform. Click on an element to activate the transfom handles for that element. The second variant is the multiple element transform. Click and drag accross a rectangular area to select elements within that area. Only elements fully contained within the area will be selected. You may then transform those elements as a group.

### Desmos Calculator Plugin ###

The desmos calculator activates within its own moveable floating window. The state of the calculator is shared among all participants.

### Shared Text Editor and Coding Evaluator

With the shared text editor, you can collaborate on a text document. Switch modes to collaborate on code in Javascript, Python, and C++. A real time compiler for each is provided, which can handle the basics of the language (nothing too fancy).
To activate the editor plugin, you will need to sign up for a free Firebase account and follow the intructions provided below.

### Element locking ###

To lock an element, select the single element transform and click on the element. At the bottom right of the screen, you will see a small lock. Click on the lock to "lock" the element. Unlock in the same manner. Once locked, the element cannot be deleted by the pink skull eraser. It may, however, be deleted by the black scull eraser. This is useful with images/documents that you want to write on top of and subsequently erase those markings.

### Keyboard Shortcuts ###

The first nine buttons, top to bottom, have keyboard shortcuts 1-9, So, for instance, the pencil tool is 1, the line tool is 2, etc.

Clear is "shift C".

Undo is "shift U"

Redo is "shift R"

Zoom in is "x".

Zoom out is "shift X"

The "z" key will zoom you all the way out and wait for the user to click on the screen. When you click a particular area of the screen, you will be automatically zoomed in to that region, with the same magnification level you started with.


Of course, you can reconfigure the shortcuts to your liking. And, you can opt to have only subset of the tools listed.

## Running your own instance of WB

If you have your own web server, and want to run a private instance of WB on it, you can. It should be very easy to get it running on your own server.

### Running the code using NPM



First [install node.js](https://nodejs.org/en/download/) (v8.0 or superior)
 if you don't have it already, then install WB:

```
npm install wb-rdbeach
```

Finally, you can start the server. Go to the wb-rdbeach directory and type:

```
PORT=8080 npm start
```

This will run WB directly on your machine, on port 8080, without any isolation from the other services.

Open the browser on your local machine and type:

```
http://localhost:8080
```
To access the index page.


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

## Setting up the editor plugin

Everything in wb works out of the box except the editor plugin. For this, you will need to sign up for an account with  [Firebase](https://firebase.google.com/). Firebase
is a suite of integrated products designed to help you develop your app, grow your user base, and
earn money. You can [sign up here for a free account](https://console.firebase.google.com/).

After signing up, you will need to enter your database info in the file board.html:

```
 <!-- Editor dep: Firebase/Firepad -->
	<script>
		var firepad_config = {
			   apiKey: '<API_KEY>',
      authDomain: "<AUTH_DOMAIN>.firebaseapp.com",
      databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
		};
	</script>
 
```

More info is available on setting up firepad/firebase in the [Firepad repo](https://github.com/FirebaseExtended/firepad).


## Troubleshooting

If you experience an issue or want to propose a new feature in WB, please [open a github issue](https://github.com/rdbeach/wb/issues/new).
