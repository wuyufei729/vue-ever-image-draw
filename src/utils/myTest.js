(function(){
    var food = {
        sex: 'male'
    }
    if (typeof define === 'function' && define.amd) {
        define('ever-exif-js', [], function() {
            return food;
        });
    }
    //return food
}).call(this)