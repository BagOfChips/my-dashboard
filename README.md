![one page reddit](https://i.imgur.com/VXo8tJ0.png)  <br />
Check it out! https://page-of-reddit.herokuapp.com/  <br />
<br />
*Reddit on a single page (for demo purposes only at the moment)* <br />
Procrastinate efficiently and avoid having your browser tab look like this
![cluttered tabs](https://i.imgur.com/qt2rQ8e.png)  <br />

## features
* Splittings posts and comments across 2 columns
* Minimalistic, fast and responsive GUI
* Simple and smooth pagination upon scrolling to the bottom of the screen 

## demo
* Using the [snoowrap wrapper API](https://github.com/not-an-aardvark/snoowrap) for Reddit, calls are made to fetch and display hot posts
![page layout](https://i.imgur.com/VyJNPoj.png)  <br />
* Clicking on comments should fetch and display them in a comment tree structure
    * A new tab should be automatically generated
    * Time stamps should appear upon hover
* Posts and comments are only fetched once, enabling quick viewing of seen or saved tabs 

## dependencies
* Backend framework
    * Node.js / [Express.js](https://expressjs.com/)
* NPM modules
    * [epoch-to-timeago](https://www.npmjs.com/package/epoch-to-timeago) - time conversion
    * [snoowrap](https://github.com/not-an-aardvark/snoowrap) - wrapper API for Reddit
    * [finish](https://www.npmjs.com/package/finish) - similar to [async](https://www.npmjs.com/package/async)
* Frontend  
    * [mCustomScrollbar](http://manos.malihu.gr/jquery-custom-content-scroller/)
    * [jQuery](https://jquery.com/)
    * [Bootstrap](https://getbootstrap.com/)

## future plans
* User authentication
* Image + Gif loading 
* Custom user defined configuration settings (eg. limit max number of fetched posts)
