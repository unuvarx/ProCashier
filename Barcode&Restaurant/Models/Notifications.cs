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
    
    public partial class Notifications
    {
        public int NotificationId { get; set; }
        public int WaiterId { get; set; }
        public int TableId { get; set; }
        public int UserId { get; set; }
        public string TableName { get; set; }
        public string Orders { get; set; }
        public System.DateTime OrderDate { get; set; }
    
        public virtual Tables Tables { get; set; }
        public virtual Users Users { get; set; }
        public virtual Waiters Waiters { get; set; }
    }
}
