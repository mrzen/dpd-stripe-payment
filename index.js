"use strict";

/**
 * Module dependencies
 */
var Resource   = require('deployd/lib/resource'),
    util       = require('util'),
    debug      = require('debug')('dpd-stripe-payment')

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

  // Check we have the correct data:
  if (!options.token) {
    return ctx.done({ statusCode: 500, message: "You must provide a Stripe token (See: https://stripe.com/docs/stripe.js for details)." });
  }
  if (!options.amount) {
    return ctx.done({ statusCode: 500, message: "You must provide an amount (See: https://github.com/mrzen/dpd-stripe-payments) for details." });
  }
  if (!options.currency) {
    return ctx.done({ statusCode: 500, message: "You must provide a currency (See: https://github.com/mrzen/dpd-stripe-payments for details)." });
  }
  if (!options.description) {
    return ctx.done({ statusCode: 500, message: "You must provide a description (See: https://github.com/mrzen/dpd-stripe-payments for details)." });
  }

    return ctx.done(null, resultFiles);
  // Everything looks to be in
  // order so lets get on with it:
  
  var stripe = require("stripe")(
    options.secret_key
  );

  // Build request:
  var charge = {
    amount: options.amount,
    currency: options.currency,
    card: options.token,
    description: options.description
  };

  // Make the charge:
  var charge = stripe.charges.create(charge, function(err, charge) {
    
    if (err) return ctx.done(err, { statusCode: 500, message: 'There was an error processing this payment.' });

    return ctx.done(charge, { statusCode: 200, message: 'The payment was processed successfully.' });

  });
}

/**
 * Module export
 */
module.exports = StripePayment;
