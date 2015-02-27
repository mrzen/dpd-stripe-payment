"use strict";

/**
 * Module dependencies
 */
var Resource   = require('deployd/lib/resource'),
    util       = require('util')

/**
 * Module setup.
 */
function StripePayment(options) {

    Resource.apply(this, arguments);

    this.config = {};

}

util.inherits(StripePayment, Resource);

StripePayment.label = "Stripe Payment";
StripePayment.prototype.clientGeneration = true;
StripePayment.basicDashboard = {
    settings: [
        {
            name: 'secret_key',
            type: 'text',
            description: 'Your Stripe Secret Key (or pass this directly in the post call).'
        }
    ]
};

/**
 * Module methods
 */
StripePayment.prototype.handle = function (ctx, next) {

  // We only support posts:
  if ( ctx.req && ctx.req.method !== 'POST' ) {
    return next();
  }

  // Stripe payments must be requested locally for security reasons.
  if ( !ctx.req.internal ) {
    return ctx.done({ statusCode: 403, message: 'Forbidden' });
  }

  var options = ctx.body || {};
  options.secret_key = options.secret_key || this.config.secret_key;
  options.metadata = options.metadata || {}

  var stripe = require("stripe")(
    options.secret_key
  );

  // Build request:
  var charge = {
    amount: options.amount,
    currency: options.currency,
    card: options.token,
    description: options.description,
    metadata: options.metadata
  };

  // Make the charge:
  var charge = stripe.charges.create(charge, function(err, charge) {
    
    if (err) return ctx.done(err);

    return ctx.done(null, charge);

  });
}

/**
 * Module export
 */
module.exports = StripePayment;
