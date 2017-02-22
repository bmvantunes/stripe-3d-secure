/**
 * When we click on a card
 */
function onClick(cardNumber) {
  const paymentRequest = {
    cardNumber: cardNumber,
    expYear: '2020',
    expMonth: '12',
    cvc: '123',
    currency: 'GBP',
    amount: 5000 * 100,
    nativeElement: document.querySelector('#iframe-payment')
  };

  doPayment(paymentRequest).then((result) => {
    console.log('result --> ', result);
    alert('Success: Token is: ' + result.id);
  }).catch((error) => {
    console.error(error);
    alert('Ups, something wrong, sorry! :(');
  });
}
