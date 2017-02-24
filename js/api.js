
/**
 * This is the main function - The only one that we should call from outside this file
 */
function doPayment(paymentRequest) {
  return new Promise((resolve, reject) => {
    const onCreateCardCallback = create3DSecure(paymentRequest, resolve, reject);
    return Stripe.source.create({
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
  return (status, cardResponse) => {
    console.log('create3DSecure --> paymentRequest', paymentRequest);
    console.log('create3DSecure --> status', status);
    console.log('create3DSecure --> createSourceResponse', cardResponse);

    if (status !== 200 || cardResponse.error) {  // problem
      reject(cardResponse.error);
    } else if (cardResponse.card.three_d_secure === 'not_supported' && cardResponse.status === 'chargeable') {
      resolve(cardResponse);
    } else if(cardResponse.card.three_d_secure === 'optional' || cardResponse.card.three_d_secure === 'required') {
      const onCreate3DSecureCallback = createIframe(paymentRequest, resolve, reject);

      Stripe.source.create({
        type: 'three_d_secure',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        three_d_secure: { card: cardResponse.id },
        redirect: { return_url: window.location.href }
      }, onCreate3DSecureCallback);
    }
    else {
      reject(cardResponse);
    }
  };
}

function createIframe(paymentRequest, resolve, reject) {
  return (status, stripe3dsResponse) => {
    console.log('Create the Iframe --> paymentRequest', paymentRequest);
    console.log('Create the Iframe --> status', status);
    console.log('Create the Iframe --> stripe3dsResponse', stripe3dsResponse);

    if (status !== 200 || stripe3dsResponse.error) {  // problem
      reject(stripe3dsResponse.error);
    } else {
      paymentRequest.nativeElement.innerHTML =
        '<iframe style="width:100%; height: 800px;" frameborder="0" src="' + stripe3dsResponse.redirect.url + '"></iframe>';

      const onPollCallbackReal = onPollCallback(paymentRequest, resolve, reject);
      Stripe.source.poll(stripe3dsResponse.id, stripe3dsResponse.client_secret, onPollCallbackReal);
    }
  };
}

function onPollCallback(paymentRequest, resolve, reject) {
  return (status, source) => {
    console.log('onPoolCallback --> ', source);
    const errorMessage = 'Sorry we got an error';

    if (status !== 200 || source.error) {
      console.log('onPoolCallback --> REJECT --> not 200 or error --> ', source);
      paymentRequest.nativeElement.innerHTML = errorMessage;
      reject(source.error);
    } else if (source.status === 'canceled' || source.status === 'consumed' || source.status === 'failed') {
      console.log('onPoolCallback --> REJECT --> canceled/consumed/fail --> ', source);
      paymentRequest.nativeElement.innerHTML = errorMessage;
      reject(source.status);
    } else if (/* source.three_d_secure.authenticated && */ source.status === 'chargeable') {
      /* some cards do not need to be authenticated, like the 4242 4242 4242 4242 */
      console.log('onPoolCallback --> SUCCESS --> ', source);
      paymentRequest.nativeElement.innerHTML = 'All your card details are ok';
      resolve(source);
    } else { 
      // something completely weird happened 
      paymentRequest.nativeElement.innerHTML = errorMessage;
      reject(source.status);
    }
  };
}
