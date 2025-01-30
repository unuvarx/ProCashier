$(document).ready(function () {
    

    let orders = JSON.parse($('input[name="ordersInput"]').val());
    displayOrders();

    let paymentCash = parseFloat($('input[name="paymentCash"]').val());
    let paymentCard = parseFloat($('input[name="paymentCard"]').val());
    let total = parseFloat(paymentCash + paymentCard);

    let carrier = $('input[name="carrier"]').val();
    let customer = $('input[name="customer"]').val();

    updateTotalSales(total, paymentCard, paymentCash, carrier, customer);
    function displayOrders() {
        try {
            orders.forEach(item => {

                if (item && item.productName && item.productPrice) {
                    const orderItem = `
                        <div class="orderItem">
                            <div class="content">
                                <div id="title">
                                    <span class="orderProductName">${item.productName}</span>
                                    <span class="orderProductPrice">${item.productPrice.toFixed(2)}TL</span>
                                </div>
                               
                                <div id="willRemove">
                                    <label> Not </label>
                                    <span class="note"> ${item.productNote} </span>
                                </div>
                            </div>
                        </div>`;

                    $('.ordersContainer .orders').append(orderItem);


                }
            });
        }
        catch (e) {
            console.error(e);
        }
        
      

    }

    function updateTotalSales(total, totalCard, totalCash, carrier, customer) {
        try {
            $('.boxes').empty();
            let baseUrl = window.location.origin;
            let totalPath = `${baseUrl}/Content/Assets/Images/totalSales.png`;
            let cashPath = `${baseUrl}/Content/Assets/Images/cash.png`;
            let cardPath = `${baseUrl}/Content/Assets/Images/credit-card.png`;
            let carrierPath = `${baseUrl}/Content/Assets/Images/delivery.png`;
            let customerPath = `${baseUrl}/Content/Assets/Images/customer.png`;

            let totalBoxHtml = `
            <div class="totalBox box">
               <span><label>Toplam Satış</label>  <img src="${totalPath}" alt="Toplam Satış" /> </span>
               <div>
                   ${total.toFixed(2)}TL
               </div>
            </div>
        `;
            let cashBoxHtml = `
            <div class="cashBox box">
               <span><label>Nakit Satış</label> <img src="${cashPath}" alt="Nakit Satış" /></span>
               <div>
                  ${totalCash.toFixed(2)}TL
               </div>
            </div>
        `;
            let cardBoxHtml = `
            <div class="cardBox box">
               <span><label>Kart Satış</label> <img src="${cardPath}" alt="Kart Satış" /></span>
               <div>
                  ${totalCard.toFixed(2)}TL
               </div>
            </div>
        `;
            $('.boxes').append(totalBoxHtml);
            $('.boxes').append(cashBoxHtml);
            $('.boxes').append(cardBoxHtml);


            if (carrier && customer) {
                let carrierBoxHtml = `
                <div class="carrierBox box">
                   <span><label>${carrier}</label> <img src="${carrierPath}" alt="${carrier}" /></span>
                   <div>
                      ${total.toFixed(2)}TL
                   </div>
                </div>`;

                let customerBoxhtml = `
                <div class="carrierBox box">
                   <span><label> Müşteri </label> <img src="${customerPath}" alt="${customer}" /></span>
                   <div>
                      ${customer}
                   </div>
                </div>
            `;


                $('.boxes').append(carrierBoxHtml);
                $('.boxes').append(customerBoxhtml);
            }
        }
        catch (e) {
            console.error(e);
        }
     
    }


});