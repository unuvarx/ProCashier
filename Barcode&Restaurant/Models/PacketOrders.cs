//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Barcode_Restaurant.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class PacketOrders
    {
        public int PacketOrderId { get; set; }
        public int UserId { get; set; }
        public int CustomerId { get; set; }
        public int CarrierId { get; set; }
        public string Orders { get; set; }
        public System.DateTime OrderStartingDate { get; set; }
        public Nullable<System.DateTime> OrderEndDate { get; set; }
        public int Status { get; set; }
        public string CardPaid { get; set; }
        public string CashPaid { get; set; }
        public string CustomerNote { get; set; }
    
        public virtual Carriers Carriers { get; set; }
        public virtual Customers Customers { get; set; }
        public virtual Users Users { get; set; }
    }
}
