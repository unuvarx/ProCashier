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
    
    public partial class SalesHistory
    {
        public int SalesHistoryId { get; set; }
        public int UserId { get; set; }
        public string TotalCost { get; set; }
        public string Products { get; set; }
        public System.DateTime Date { get; set; }
        public string CardPaid { get; set; }
        public string CashPaid { get; set; }
    
        public virtual Users Users { get; set; }
    }
}
