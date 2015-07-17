/**
 * ExchangeController
 *
 * @description :: Server-side logic for managing Exchanges
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	


  /**
   * `ExchangeController.index()`
   */
  index: function (req, res) {
    Exchange.find().exec(function(err, exchanges) {
        res.render('exchange/index', {'exchanges':exchanges});
        return;
    });
  },


  /**
   * `ExchangeController.create()`
   */
  create: function (req, res) {
    var params = req.params.all();
    
    Exchange.create({name: params.name, apikey: params.apikey, secretkey: params.secretkey}).exec(function createCB(err, created) {
        return res.json({
            notice: 'Created Exchange entry with the name ' + created.name
        });        
    });
  },


  /**
   * `ExchangeController.show()`
   */
  show: function (req, res) {
    var id = req.param("id", null);
    
    Exchange.findOne(id).exec(function(err, model) {
        res.render('exchange/show',{'model':model});
    });
  },


  /**
   * `ExchangeController.edit()`
   */
  update: function (req, res) {
    var id=req.param("id", null);
    
    Exchange.findOne(id).exec(function(err, model) {
        if(req.method=="POST"&& req.param("Exchange", null) != null) {
            var xchg = req.param("Exchange", null);
            
            model.name = xchg.name;
            model.apikey = xchg.apikey;
            model.secretkey = xchg.secretkey;
            
            model.save(function(err) {
                if(err) {
                    res.send("Error");
                } else {
                    res.redirect("exchange/view/" + model.id);
                }                
            });
        } else {
            res.render("exchange/update", {'model':model});
        }        
    });
  },


  /**
   * `ExchangeController.delete()`
   */
  delete: function (req, res) {
    var id = req.param("id", null);
    Exchange.findOne(id).done(function(err, xchg) {
        xchg.destroy(function(err) {
            res.redirect("exchange/index/");
        });
        // Record's been removed.
    });
  }
};

