API's Available:

Insert API Endpoint:{hostaddress}/api/gallery/insert



- This is POST request API

Request Structure:
    {
        "images":[
            {"url": "https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg", "description": "sasa"}
        ]
    }
Response Structure:

{
    "status": "success",
    "message": "Images uploaded successfully",
    "result": [
        {
            "status": "success",
            "message": "Image uploaded successfully",
            "url": "https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg",
            "image_path": "https://gallery-images-com.s3.amazonaws.com/60f42102d4a1fe598d63e174Snake_River_%285mb%29.jpg",
            "_id": "60f42104d4a1fe598d63e175"
        }
    ]
}


- Max length of images array should be 20
- We should allow users to send 20 public Image URLs as an API request. Each image
should have a small description.

List API Endpoint : {hostaddress}/api/gallery/list 
- This is POST request API

- This API will retrun the list of images based on the filter and sorts latest document first.

Request Structure:

{
   
    "no_of_records_per_page":20, // calculates and limits the results to this value
    "page_number":1, // server side pagination, returns the records of the 
    "filter":{
        "description":"sa", // to search based on description
        "from_date":"2021-07-18", // to search based on the records after this time
        "to_date":""// to search based on the records before this time
    }
}

Response Structure:

{
    "status": "success",
    "message": "Data fetched successfully",
    "images": [
          {
            "_id": "60f41e7f9cac2256c883f6f2",
            "description": "sasa",
            "image_path": "https://gallery-images-com.s3.amazonaws.com/60f41e7e9cac2256c883f6e2logo3w.png",
            "created_at": "2021-07-18T12:28:47.071Z"
        }
    ] 
}