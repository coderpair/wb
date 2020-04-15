# WB

WB is an online collaborative whiteboard focusing primarily on the needs of online teachers/students


This board is an extension of the [lovasoa/whitebophir](https://github.com/lovasoa/whitebophir) project.

A demonstration server is available at [lcfprep.com/wb2/wb.html](https://lcfprep.com/wb2/wb.html)

## Screenshots

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

### Running the code

First, download the sources:
```
git clone git@github.com:rdbeach/wb.git
cd wb
```

Then [install node.js](https://nodejs.org/en/download/) if you don't have it already, then install WB's dependencies:
```
npm install
```

Finally, you can start the server:
```
PORT=5001 npm start
```

This will run WB directly on your machine, on port 5001, without any isolation from the other services.

## Troubleshooting

If you experience an issue or want to propose a new feature in WB, please [open a github issue](https://github.com/rdbeach/wb/issues/new).
