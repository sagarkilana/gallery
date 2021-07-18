var Q = require('q');
var database = require('../database.js');
var awsService = require('../service/aws.service.js');
var fs = require('fs'),
request = require('request');
const tempUploadPath = './temp'
const path = require('path');


var gallery = {};
gallery.uploadImages = uploadImages;
gallery.listImages = listImages;
module.exports = gallery;

async function listImages(params) {
    if( params.page_number) pageNo = params.page_number;

    var deferred = Q.defer();
    var pageNo = 1;
    if(params && params.page_number) pageNo = params.page_number;
    var size = 10;
    if(params.no_of_records_per_page) size=params.no_of_records_per_page;
    var skip = size * (pageNo - 1);
    var limit = size;
    var cond = {};
    var dateFilterRequired = false
    var dateFilter = {}
    if (params.filter && params.filter.description && params.filter.description != "") {
        cond.description = { $regex: params.filter.description.trim(), $options: 'i' }
    }
    if (params.filter && params.filter.from_date) {
        dateFilterRequired = true;
        dateFilter.$gte = new Date(params.filter.from_date)
    }
    if (params.filter && params.filter.to_date) {
        dateFilterRequired = true;
        dateFilter.$lte = new Date(params.filter.to_date)
    }
    if (dateFilterRequired) cond.created_at = dateFilter;
    database.gallery_images.find(cond, {}, { limit: limit, skip: skip }).sort({ _id: -1 }, async function (err, images) {
        if (err) {
            deferred.resolve({
                status: 'failed',
                message: "Failed to fetch the records",
                error: err
            });
        } else if (images && images.length > 0) {

            deferred.resolve({
                status: 'success',
                message: "Data fetched successfully",
                images: images
            });


        } else {
            deferred.resolve({
                status: 'failed',
                message: "No images to show",
                images: []
            });
        }
    });

    return deferred.promise;
}

async function uploadImages(params) {
    var deferred = Q.defer();
    if (!params.images || params.images.length == 0) deferred.resolve({ status: 'failed', message: 'No images to uploaded' })
    else if (params.images && params.images.length > 20) deferred.resolve({ status: 'failed', message: 'No of images exceeds 20.' })
    else {
        var responses = []
        await Promise.all(params.images.map(async (image, ind) => {
            var trasnferRes = await uploadToS3(image)
            responses.push(trasnferRes)
        }));
        deferred.resolve({
            status: 'success',
            message: "Images uploaded successfully",
            result: responses
        });
        function uploadToS3(image) {
            var deferred = Q.defer();
            if (image.url) {
                var uri = image.url
                let fileNames = uri.split('/').reverse()
                var filename = fileNames[0]
                if (filename) {
                    var extension = path.extname(filename);
                 
                    if (extension.toLowerCase() == ".jpg" || extension.toLowerCase() == ".jpeg"|| extension.toLowerCase() == ".png"|| extension.toLowerCase() == ".tiff") {

                    filePath = tempUploadPath + '/' + filename
                    var download = function (uri, filename, callback) {
                        request.head(uri, function (err, res, body) {
                            console.log('content-type:', res.headers['content-type']);
                            console.log('content-length:', res.headers['content-length']);

                            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
                        });
                    };
                    download(uri, filePath, function () {
                        awsService.uploadToS3({ fileName: filename, }).then(function (s3res) {
                            if (s3res && s3res.status == 'success') {
                                var imageRec = {
                                    description: image.description ? image.description : '',
                                    image_path: s3res.image_path,
                                    created_at:new Date()
                                }
                                database.gallery_images.insert(imageRec, async function (err, insertedimage) {
                                    if (err) {
                                        console.log('err', err)
                                        deferred.resolve({
                                            status: 'failed',
                                            message: "Failed to insert the records",
                                            error: err
                                        });
                                    } else {
                                        console.log('insertedimage',insertedimage)
                                        deferred.resolve({
                                            status: 'success',
                                            message: "Image uploaded successfully",
                                            url: uri,
                                            image_path:s3res.image_path,
                                            _id:insertedimage._id
                                        });
                                    }
                                })
                            } else {
                                deferred.resolve({
                                    status: 'failed',
                                    message: s3res.message ? s3res.message : "Failed to upload image",
                                    url: uri
                                });
                            }
                        });
                    });

                }else{
                    deferred.resolve({ status: 'failed', message: 'Allowed jpg,jpeg,tiff or png' })
                }
                } else {
                    deferred.resolve({ status: 'failed', message: 'Invalid image URL' })
                }
            } else {
                deferred.resolve({ status: 'failed', message: 'Image URL not found' })
            }
            return deferred.promise;

        }
    }
    return deferred.promise;
}