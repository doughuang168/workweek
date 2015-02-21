# workweek
Simple RESTful API implementation using MEAN stack in Openshift cloud
## Welcome to Workweek RESTful API ##

**Workweek API** is a simple RESTful Web Service implemented in Express with MongoDB as data store.  And hosted in Openshift cloud. 

### REST API End point ###
- **http://workweek-doughuang.rhcloud.com/workweek**


### Simple REST Interface ###
 
To get the work week of a specific date:



- http://workweek-doughuang.rhcloud.com/workweek/wwdate
 

Where **wwdate**  have the format: **yyyy-mm-dd**  



## API usage example  
Request url:

- http://workweek-doughuang.rhcloud.com/workweek/2015-02-01
 

Response JSON:

{
  "status": "success", "message" : "", "workweek" : "2015WW06"
}


 
## Angular Directive Demo
To see the dynamic nature of WebService being used. I implement a simple AngularJS directive as the WebService consumer.


You can see the demo [here](http://workweek-doughuang.rhcloud.com)
