/**
 * Loading external libraries used
 */
 var express = require('express');
 var galleryService = require('../service/gallery.service.js');

 var router = express.Router();

 router.post('/insert', uploadImages);
 router.post('/list', listImages);
 router.get('/', function (req, res, next) {
    res.render('index.html');
});
 module.exports = router;


function uploadImages(req, res) {
    galleryService.uploadImages(req.body).then(function(response){
        res.send(response)
    })
  
}

function listImages(req, res) {
    galleryService.listImages(req.body).then(function(response){
        res.send(response)
    })
  
}