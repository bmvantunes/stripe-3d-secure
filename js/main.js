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
  
  paymentRequest.nativeElement.innerHTML = 'Loading... Please wait...';

  doPayment(paymentRequest).then((result) => {
    console.log('result --> ', result);
    paymentRequest.nativeElement.innerHTML = 'Success!!!! Your details are correct!!! :)';
    alert('Success: Token is: ' + result.id);
  }).catch((error) => {
    console.error(error);
    paymentRequest.nativeElement.innerHTML = 'Ups! We can\t validate your details...';
    alert('Ups, something wrong, sorry! :(');
  });
}
