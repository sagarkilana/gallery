
const s3bucketName='gallery-images-com'
const accessKeyId='AKIA43X3J5VTAMV33OPD'
const secretAccessKey='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'
const tempUploadPath='./temp'
var Q = require('q');
const path = require('path');
var fs = require('fs');
var AWS = require('aws-sdk');
var mongojs = require('mongojs');

var aws = {};
aws.uploadToS3 = uploadToS3;
aws.downloadImage = downloadImage;
module.exports = aws;


function downloadImage(params) {
    var destinationPath = config.tempUploadPath;
    var uploadedPath;

    var deferred = Q.defer();
    try {

        var s3 = new AWS.S3({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        });
        var awsParams = {
            Bucket: s3bucketName,
            Key: uploadedPath + "/" + params.fileName,
        };

        downLoadObjectFromS3(1)
        function downLoadObjectFromS3(attempt) {
            console.log('downLoadObjectFromS3: ', attempt);
            var fileName = destinationPath + "/" + mongojs.ObjectId() + '_' + params.fileName
            var decUnqFileName = destinationPath + "/" + mongojs.ObjectId() + '_' + decryptedFileName
            var file = fs.createWriteStream(fileName);
            console.log('fileName: ', fileName);
            console.log('decUnqFileName: ', decUnqFileName);
            console.log('before get: ', fileName);
            s3.getObject(awsParams).promise().then(function (data) {
                console.log('after get object: ', fileName);
                file.write(data.Body);
                file.end();
                file.on('close', function (created) {

                    console.log('before decryptFile: ', fileName, decUnqFileName);
                    encryptor.decryptFile(fileName, decUnqFileName, organisationInfo.smart_key, function (err) {
                        // Decryption complete.
                        console.log('after decryptFile: ', fileName);
                        //deleting encrypted file
                        if (fs.existsSync(fileName)) {
                            fs.unlink(fileName, function (err) {
                                if (err) {
                                    console.log('err: ', err);
                                    // Report Error
                                }
                                // deferred.resolve(destinationPath + "/" + decryptedFileName);
                            });
                        }
                        if (err) {
                            if (fs.existsSync(decUnqFileName)) {
                                fs.unlink(decUnqFileName, function (err) {
                                    if (err) {
                                        console.log('decUnqFileName unlink err: ', decUnqFileName, err);
                                    }
                                })
                            }
                            console.log('AWS Decrypt err: ', err);
                            if (attempt < 3) {
                                downLoadObjectFromS3(attempt + 1)
                            } else {
                                errorLog.errorTitle = 'Exception while decrypting the file';
                                errorLog.errorInfo = { status: 'failed', message: 'Exception while decrypting the file', error: { aws_params: awsParams, err: err }, attempt: attempt };
                                errorLog.triggerEmail = true;
                                reportError.report(errorLog);
                                deferred.reject({ status: 'failed', message: 'Exception while decrypting the file', err: err, attempt: attempt })
                            }
                        } else {
                            //checking if pdf created, 
                            if (fs.existsSync(decUnqFileName)) {
                                const pdfstats = fs.statSync(decUnqFileName);
                                const pdffileSizeInBytes = pdfstats.size;
                                const pdffileSizeInKB = pdffileSizeInBytes / 1024;
                                //checking the size of the pdf
                                if (isPDF && pdffileSizeInKB < 1) {
                                    if (fs.existsSync(decUnqFileName)) {
                                        fs.unlink(decUnqFileName, function (err) {
                                            if (err) {
                                                console.log('decUnqFileName unlink err: ', decUnqFileName, err);
                                            }
                                        })
                                    }
                                    if (attempt < 3) {
                                        downLoadObjectFromS3(attempt + 1)
                                    } else {
                                        errorLog.errorTitle = 'Invalid file size';
                                        errorLog.errorInfo = { status: 'failed', message: 'Invalid file size', error: { aws_params: awsParams, pdffilesize: pdffileSizeInKB }, attempt: attempt };
                                        reportError.report(errorLog);
                                        deferred.reject({ status: 'failed', message: 'Invalid file', attempt: attempt })
                                    }
                                } else {
                                    try {
                                        var validFile = true;

                                        console.log('validFile: ', validFile);

                                        if (validFile) {
                                            fs.readFile(decUnqFileName, function (err, data) {
                                                if (fs.existsSync(decUnqFileName)) {
                                                    fs.unlink(decUnqFileName, function (err) {
                                                        if (err) {
                                                            console.log('decUnqFileName unlink err: ', decUnqFileName, err);
                                                        }
                                                    })
                                                }
                                                if (err) {
                                                    console.log('file write in AWS Download err: ', err);
                                                    if (attempt < 3) {
                                                        downLoadObjectFromS3(attempt + 1)
                                                    } else {
                                                        errorLog.errorTitle = 'Failed to read the file';
                                                        errorLog.errorInfo = { status: 'failed', message: 'Failed to read the file', error: { aws_params: awsParams, err: err }, attempt: attempt };
                                                        errorLog.triggerEmail = true;
                                                        reportError.report(errorLog);
                                                        deferred.reject({ status: 'failed', message: 'Failed to read the file', attempt: attempt })
                                                    }
                                                } else {
                                                    console.log('resolved downLoadFile: ', destinationPath + "/" + decryptedFileName);
                                                    deferred.resolve({ status: 'success', buffer: data });
                                                }
                                            })
                                        } else {
                                            if (isPDF) {
                                                // inStream.close()
                                            }
                                            if (fs.existsSync(decUnqFileName)) {
                                                fs.unlink(decUnqFileName, function (err) {
                                                    if (err) {
                                                        console.log('decUnqFileName unlink err: ', decUnqFileName, err);
                                                    }
                                                })
                                            }
                                            if (attempt < 3) {
                                                downLoadObjectFromS3(attempt + 1)
                                            } else {
                                                errorLog.errorTitle = 'Invalid PDF file';
                                                errorLog.errorInfo = { status: 'failed', message: 'Invalid PDF file, may be encryped', error: { aws_params: awsParams, pages: pages }, attempt: attempt };
                                                reportError.report(errorLog);
                                                deferred.reject({ status: 'failed', message: 'Invalid PDF file', attempt: attempt })
                                            }
                                        }
                                    } catch (err) {
                                        if (fs.existsSync(decUnqFileName)) {
                                            fs.unlink(decUnqFileName, function (err) {
                                                if (err) {
                                                    console.log('decUnqFileName unlink err: ', decUnqFileName, err);
                                                }
                                            })
                                        }
                                        if (attempt < 3) {
                                            downLoadObjectFromS3(attempt + 1)
                                        } else {
                                            errorLog.errorTitle = 'Invalid file';
                                            errorLog.errorInfo = { status: 'failed', message: 'Invalid PDF file', error: { aws_params: awsParams, err: err }, attempt: attempt };
                                            reportError.report(errorLog);
                                            deferred.reject({ status: 'failed', message: 'Invalid PDF file', attempt: attempt })
                                        }
                                    }
                                }
                            } else {
                                console.log("file not exists", destinationPath + "/" + decryptedFileName)
                                //retry as the file doesnt exists
                                if (attempt < 3) {
                                    downLoadObjectFromS3(attempt + 1)
                                } else {
                                    errorLog.errorTitle = 'PDF not exists';
                                    errorLog.errorInfo = { status: 'failed', message: 'PDF not exists', error: { aws_params: awsParams }, attempt: attempt };
                                    reportError.report(errorLog);
                                    deferred.reject({ status: 'failed', message: 'PDF not exists', attempt: attempt })
                                }
                            }
                        }

                    });

                })

            }).catch(function (err) {
                console.log(err)
                if (fs.existsSync(fileName)) {
                    fs.unlink(fileName, function (err) {
                        if (err) {
                            console.log('err: ', err);
                        }
                    });
                }
                console.log('aws - downlad err: ', awsParams);
                if (attempt < 3) {
                    downLoadObjectFromS3(attempt + 1)
                } else {
                    errorLog.errorTitle = 'Exception while downloading the file from AWS';
                    errorLog.errorInfo = { status: 'failed', message: 'Exception while downloading the file', error: { aws_params: awsParams, err: err }, attempt: attempt };
                    errorLog.triggerEmail = true;
                    reportError.report(errorLog);
                    deferred.reject({ status: 'failed', message: 'Exception while downloading the file from AWS', err: err, attempt: attempt })
                }
            })
        }
    }
    catch (downloaderror) {
        deferred.resolve({ status: "failed", message: 'Unknown exception', result: downloaderror })
    }
    return deferred.promise;
}


function uploadToS3(params) {
    var deferred = Q.defer();
        var uploadedPath = tempUploadPath;
        var extension = path.extname(params.fileName);
        var basename = path.basename(params.fileName, extension);
        if (extension.toLowerCase() == ".pdf" || extension.toLowerCase() == ".csv") deferred.resolve({ status: 'failed', message: 'Allowed only image files' })
        else {
                if (fs.existsSync(tempUploadPath + '/' + params.fileName)) {
                    const filwstats = fs.statSync(tempUploadPath + '/' + params.fileName);
                    const fileSizeInBytes = filwstats.size;
                    const fileSize = fileSizeInBytes / 1024 / 1024;
                    if (fileSizeInBytes > 1 || fileSize <= 4) {

                        fs.readFile(uploadedPath + '/' + params.fileName, function (err, data) {
                            if (err) {
                                deferred.resolve({ status: 'failed', message: 'Failed to read the image' });
                            } else {
                                var s3 = new AWS.S3({
                                    accessKeyId: accessKeyId,
                                    secretAccessKey: secretAccessKey
                                });
                                var awsParams = {
                                    Bucket: s3bucketName,
                                    Key: mongojs.ObjectId()+params.fileName,
                                    Body: data,
                                    ContentDisposition: 'filename="' + params.fileName,
                                    StorageClass: 'STANDARD',
                                    ACL: 'public-read-write'
                                };

                                s3.putObject(awsParams, function (err, data) {
                                    if (err) {
                                        console.log('err',err)
                                        deferred.resolve({ status: 'failed', message: 'Exception while moving the file' });
                                    }
                                    else {
                                        //Delete file from local system
                                        if (fs.existsSync(uploadedPath + '/' + params.fileName)) {
                                            fs.unlink(uploadedPath + '/' + params.fileName, function (err) {
                                                if (err) {
                                                }
                                            });
                                        }
                                        deferred.resolve({status:'success',image_path:"https://"+s3bucketName+".s3.amazonaws.com/"+awsParams.Key});
                                    }
                                });
                            }
                        });
                    } else {
                        deferred.resolve({ status: 'failed', message: 'Invalid image size or cannot exceed 4 mb' });
                    }
                } else {
                    deferred.resolve({ status: 'failed', message: 'Image not found' });
                }
        }
   
    return deferred.promise;
}