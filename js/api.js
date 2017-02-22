
/**
 * This is the main function - The only one that we should call from outside this file
 */
function doPayment(paymentRequest) {
  return new Promise((resolve, reject) => {
    const onCreateCardCallback = this.create3DSecure(paymentRequest, resolve, reject);
    return this.Stripe.source.create({
      type: 'card',
      card: {
        number: paymentRequest.cardNumber,
        cvc: paymentRequest.cvc,
        exp_month: paymentRequest.expMonth,
        exp_year: paymentRequest.expYear
      }
    }, onCreateCardCallback);
  });
}

function create3DSecure(paymentRequest, resolve, reject) {
  const onCreate3DSecureCallback = this.createIframe(paymentRequest, resolve, reject);
  return (status, cardResponse) => {
    if (status !== 200 || cardResponse.error) {  // problem
      reject(cardResponse.error);
    } else if (cardResponse.card.three_d_secure === 'not_supported') {
      resolve(cardResponse.id);
    } else {
      this.Stripe.source.create({
        type: 'three_d_secure',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        three_d_secure: { card: cardResponse.id },
        redirect: { return_url: window.location.href }
      }, onCreate3DSecureCallback);
    }
  };
}

function createIframe(paymentRequest, resolve, reject) {
  return (status, stripe3dsResponse) => {
    if (status !== 200 || stripe3dsResponse.error) {  // problem
      reject(stripe3dsResponse.error);
    } else {
      paymentRequest.nativeElement.innerHTML =
        '<iframe style="width:100%; height: 800px;" frameborder="0" src="' + stripe3dsResponse.redirect.url + '"></iframe>';

      const onPollCallbackReal = this.onPollCallback(paymentRequest, resolve, reject);
      this.Stripe.source.poll(stripe3dsResponse.id, stripe3dsResponse.client_secret, onPollCallbackReal);
    }
  };
}

function onPollCallback(paymentRequest, resolve, reject) {
  return (status, source) => {
    if (status !== 200 || source.error) {
      reject(source.error);
    } else if (source.status === 'canceled' || source.status === 'consumed' || source.status === 'failed') {
      reject(source.status);
    } else if (source.three_d_secure.authenticated && source.status === 'chargeable') {
      paymentRequest.nativeElement.innerHTML = '';
      resolve(source);
    }
  };
}
