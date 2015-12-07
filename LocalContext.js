/**
 * Context that can be called for succeeed and fail
 */
var LocalContext = (function(){

    /**
     * Construct a local Context
     *
     * @param {Object} res         Response Object
     * @param {String} contentType ContentType to return
     *
     * @return {void}
     */
    function LocalContext (res, contentType) {
        this._name = 'LocalContext';
        this._data = '';
        this._res = res;
        this._contentType = contentType;
    };

    /**
     * Fail Method, beeing called by Handler
     *
     * @param {String} msg Message to return
     *
     * @return {void}
     */
    LocalContext.prototype.fail = function (msg) {
        this._data = msg
        return this.finish(404);
    };


    /**
     * Success Method, beeing called by Handler
     *
     * @param {String} msg Message to return
     *
     * @return {void}
     */
    LocalContext.prototype.succeed = function (msg) {
        this._data = msg
        return this.finish(200);
    };

    /**
     * Done Method, beeing called by Handler
     *
     * @param {String} msg Message to return
     *
     * @return {void}
     */
    LocalContext.prototype.done = function (anything, data) {
        this._data = data;
        return this.finish(200);
    };

    /**
     * helper method to return content and http response code
     *
     * @param {Integer} code Http Status Code
     *
     * @return {void}
     */
    LocalContext.prototype.finish = function (code) {
        this._res.writeHead(code, {
            'Content-Type': this._contentType
        });

        if (this._contentType != 'text/html') {
            this._res.end(JSON.stringify(this._data));
        } else {
            this._res.end(this._data);
        }
    };

    return LocalContext;
})();

module.exports = LocalContext;