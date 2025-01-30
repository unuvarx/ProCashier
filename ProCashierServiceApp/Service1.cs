using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Net;
using System.ServiceProcess;
using System.Text;
using System.Threading;

namespace ProCashierService
{

    public partial class Service1 : ServiceBase
    {

        private HttpListener _listener;
        private const string UrlPrefix = "http://localhost:8081/";


        public Service1()
        {
            InitializeComponent();
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add(UrlPrefix);
                _listener.Start();
                _listener.BeginGetContext(new AsyncCallback(OnRequestReceived), _listener);
                EventLog.WriteEntry("Service started successfully.");
            }
            catch (Exception ex)
            {
                EventLog.WriteEntry($"Service failed to start: {ex.Message}", EventLogEntryType.Error);
                throw;
            }
        }

        protected override void OnStop()
        {
            _listener.Stop();
            _listener.Close();
        }

        private void OnRequestReceived(IAsyncResult result)
        {
            try
            {
                if (!_listener.IsListening)
                    return;

                HttpListenerContext context = _listener.EndGetContext(result);
                _listener.BeginGetContext(new AsyncCallback(OnRequestReceived), _listener);

                HttpListenerRequest request = context.Request;
                HttpListenerResponse response = context.Response;

                // CORS başlıklarını ekleyin
                response.AddHeader("Access-Control-Allow-Origin", "https://procashier.com.tr");
                response.AddHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
                response.AddHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");

                if (request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = (int)HttpStatusCode.OK;
                    response.Close();
                    return;
                }

                if (request.HttpMethod == "POST" && request.HasEntityBody)
                {
                    using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
                    {
                        string requestBody = reader.ReadToEnd();

                        // Eğer request body PrintInvoice işlemi için ise
                        if (request.Url.AbsolutePath == "/printinvoice")
                        {
                            var orderData = JsonConvert.DeserializeObject<InvoiceData>(requestBody);
                            PrintInvoice(orderData);
                        }
                        else if (request.Url.AbsolutePath == "/printdiscountreceipt")
                        {
                            var orderData = JsonConvert.DeserializeObject<DiscountData>(requestBody);
                            PrintDiscountReceipt(orderData);
                        }
                        else if (request.Url.AbsolutePath == "/printpacketorder")
                        {
                            var orderData = JsonConvert.DeserializeObject<PacketOrderData>(requestBody);
                            PrintPacketOrder(orderData);
                        }
                        else if (request.Url.AbsolutePath == "/printbarcode")
                        {
                            var orderData = JsonConvert.DeserializeObject<BarcodeData>(requestBody);
                            PrintBarcode(orderData);
                        }
                        else
                        {
                            var orderData = JsonConvert.DeserializeObject<ReceiptData>(requestBody);
                            PrintReceipt(orderData); // Default işlem PrintReceipt
                        }
                    }

                    string responseString = "Receipt printed successfully.";
                    byte[] buffer = Encoding.UTF8.GetBytes(responseString);
                    response.ContentLength64 = buffer.Length;
                    var output = response.OutputStream;
                    output.Write(buffer, 0, buffer.Length);
                    output.Close();
                }
            }
            catch (Exception ex)
            {
                EventLog.WriteEntry($"Error processing request: {ex.Message}", EventLogEntryType.Error);
            }
        }





        private void PrintReceipt(ReceiptData orderData)
        {
            PrintDocument printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = "ZJ-58";

            int paperWidthMm = 58; // mm
            int paperHeightMm = 80; // mm
            int dpi = 203;
            printDoc.DefaultPageSettings.PaperSize = new PaperSize("Custom", (int)(paperWidthMm / 25.4 * dpi), (int)(paperHeightMm / 25.4 * dpi));
            printDoc.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);

            printDoc.PrintPage += (sender, e) =>
            {
                Graphics graphics = e.Graphics;
                Font printFont = new Font("Poppins", 8);
                SolidBrush printBrush = new SolidBrush(Color.Black);

                int yPosition = 0;
                int lineHeight = (int)printFont.GetHeight(graphics);
                int paperWidth = (int)printDoc.DefaultPageSettings.PrintableArea.Width;

                try
                {
                    string userName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.UserName));
                    Font userFont = new Font("Poppins", 12);
                    SizeF userNameSize = graphics.MeasureString(userName, userFont);
                    float userNameX = (paperWidth - userNameSize.Width) / 2;
                    graphics.DrawString(userName, userFont, printBrush, new PointF(userNameX, yPosition));

                    yPosition += lineHeight + 20;
                    graphics.DrawString(Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.TableName)), new Font("Poppins", 10), printBrush, new PointF(0, yPosition));
                    SizeF orderDateSize = graphics.MeasureString(orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss"), printFont);
                    graphics.DrawString(orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss"), printFont, printBrush, new PointF(paperWidth - orderDateSize.Width - 5, yPosition));

                    yPosition += lineHeight + 10;

                    foreach (var item in orderData.Orders)
                    {
                        
                        string productName = item.productName.Length > 20 ?
                                             item.productName.Substring(0, 20) + ".." :
                                             item.productName;
                        productName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(productName));

                        string productPrice = Encoding.UTF8.GetString(Encoding.Default.GetBytes(item.productPrice + " TL"));

                        graphics.DrawString(productName, printFont, printBrush, new PointF(0, yPosition));
                        graphics.DrawString(productPrice, printFont, printBrush, new PointF(paperWidth - graphics.MeasureString(productPrice, printFont).Width - 5, yPosition));
                        graphics.DrawString("x " + item.quantity.ToString(), printFont, printBrush, new PointF(graphics.MeasureString(productName, printFont).Width + 5, yPosition));

                        yPosition += lineHeight;
                    }


                    yPosition += lineHeight;
                    Font totalFont = new Font("Poppins", 10, FontStyle.Bold | FontStyle.Underline);
                    SizeF totalSize = graphics.MeasureString("TOPLAM: " + orderData.TotalCost + "TL", totalFont);
                    graphics.DrawString("TOPLAM: " + orderData.TotalCost + "TL", totalFont, printBrush, new PointF(paperWidth - totalSize.Width - 5, yPosition));
                }
                catch (Exception ex)
                {
                    EventLog.WriteEntry($"Print page error: {ex.Message}", EventLogEntryType.Error);
                    throw;
                }
            };


            try
            {
                printDoc.Print();
                EventLog.WriteEntry("Print job completed successfully.");
            }
            catch (Exception ex)
            {
                EventLog.WriteEntry($"Print failed: {ex.Message}", EventLogEntryType.Error);
            }
        }


        private void PrintInvoice(InvoiceData orderData)
        {
            PrintDocument printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = "ZJ-58";

            int paperWidthMm = 58; // mm
            int paperHeightMm = 80; // mm
            int dpi = 203;

            printDoc.DefaultPageSettings.PaperSize = new PaperSize("Custom", (int)(paperWidthMm / 25.4 * dpi), (int)(paperHeightMm / 25.4 * dpi));
            printDoc.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);

            printDoc.PrintPage += (sender, e) =>
            {
                Graphics graphics = e.Graphics;
                Font printFont = new Font("Poppins", 8);
                SolidBrush printBrush = new SolidBrush(Color.Black);
                StringFormat format = new StringFormat
                {
                    LineAlignment = StringAlignment.Near,
                    Alignment = StringAlignment.Near,
                    FormatFlags = StringFormatFlags.LineLimit | StringFormatFlags.NoClip
                };

                int yPosition = 0;
                int lineHeight = (int)printFont.GetHeight(graphics);
                int paperWidth = (int)printDoc.DefaultPageSettings.PrintableArea.Width;

                // Masanın adını ve sipariş tarihini yazdırın
                string tableName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.TableName));
                graphics.DrawString(tableName, new Font("Poppins", 10), printBrush, new PointF(0, yPosition));

                string orderDate = orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss");
                SizeF orderDateSize = graphics.MeasureString(orderDate, printFont);
                graphics.DrawString(orderDate, printFont, printBrush, new PointF(paperWidth - orderDateSize.Width - 5, yPosition));

                yPosition += lineHeight + 10;

                foreach (var item in orderData.Orders)
                {
                    
                    string productName = item.productName.Length > 20 ?
                                         item.productName.Substring(0, 20) + ".." :
                                         item.productName;
                    productName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(productName));
                    graphics.DrawString(productName, printFont, printBrush, new PointF(0, yPosition));

                    string quantityText = "x " + item.quantity.ToString();
                    graphics.DrawString(quantityText, printFont, printBrush, new PointF(paperWidth - graphics.MeasureString(quantityText, printFont).Width - 5, yPosition));

                    if (!string.IsNullOrEmpty(item.productNote))
                    {
                        string productNote = Encoding.UTF8.GetString(Encoding.Default.GetBytes("*" + item.productNote));
                        RectangleF noteRectangle = new RectangleF(0, yPosition + lineHeight, paperWidth, lineHeight * 2);
                        graphics.DrawString(productNote, printFont, printBrush, noteRectangle, format);
                        yPosition += (int)((lineHeight + 3) * 2);
                    }
                    else
                    {
                        yPosition += lineHeight + 7;
                    }
                }


                // Toplam tutarı yazdırın
                string totalCostText = Encoding.UTF8.GetString(Encoding.Default.GetBytes("TOPLAM: " + orderData.TotalCost + "TL"));
                Font totalFont = new Font("Poppins", 10, FontStyle.Bold | FontStyle.Underline);
                SizeF totalSize = graphics.MeasureString(totalCostText, totalFont);
                graphics.DrawString(totalCostText, totalFont, printBrush, new PointF(paperWidth - totalSize.Width - 5, yPosition));
            };

            try
            {
                printDoc.Print();
            }
            catch (Exception ex)
            {
                EventLog.WriteEntry($"Print failed: {ex.Message}", EventLogEntryType.Error);
            }
        }



        private void PrintDiscountReceipt(DiscountData orderData)
        {
            PrintDocument printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = "ZJ-58";

            int paperWidthMm = 58; // mm
            int paperHeightMm = 80; // mm
            int dpi = 203;
            printDoc.DefaultPageSettings.PaperSize = new PaperSize("Custom", (int)(paperWidthMm / 25.4 * dpi), (int)(paperHeightMm / 25.4 * dpi));
            printDoc.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);

            printDoc.PrintPage += (sender, e) =>
            {
                Graphics graphics = e.Graphics;
                Font printFont = new Font("Poppins", 8);
                SolidBrush printBrush = new SolidBrush(System.Drawing.Color.Black);

                int yPosition = 0;
                int lineHeight = (int)printFont.GetHeight(graphics);
                int paperWidth = (int)printDoc.DefaultPageSettings.PrintableArea.Width;

                // Kullanıcı adını yazdırma
                string userName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.UserName));
                Font userFont = new Font("Poppins", 12);
                SizeF userNameSize = graphics.MeasureString(userName, userFont);
                float userNameX = (paperWidth - userNameSize.Width) / 2;

                graphics.DrawString(userName, userFont, printBrush, new PointF(userNameX, yPosition));

                yPosition += lineHeight + 20;

                // Masa adını ve sipariş tarihini yazdırma
                graphics.DrawString(Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.TableName)), new Font("Poppins", 10), printBrush, new PointF(0, yPosition));
                SizeF orderDateSize = graphics.MeasureString(orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss"), printFont);
                graphics.DrawString(orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss"), printFont, printBrush, new PointF(paperWidth - orderDateSize.Width - 5, yPosition));

                yPosition += lineHeight + 10;

                // Ürünleri yazdırma
                foreach (var item in orderData.Orders)
                {
                    
                    string productName = item.productName.Length > 20 ?
                                         item.productName.Substring(0, 20) + ".." :
                                         item.productName;
                    productName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(productName));

                    string productPrice = Encoding.UTF8.GetString(Encoding.Default.GetBytes(item.productPrice + " TL"));

                    graphics.DrawString(productName, printFont, printBrush, new PointF(0, yPosition));
                    graphics.DrawString(productPrice, printFont, printBrush, new PointF(paperWidth - graphics.MeasureString(productPrice, printFont).Width - 5, yPosition));
                    graphics.DrawString("x " + item.quantity.ToString(), printFont, printBrush, new PointF(0 + graphics.MeasureString(productName, printFont).Width + 5, yPosition));

                    yPosition += lineHeight;
                }


                // İndirim ve toplam tutarı yazdırma
                yPosition += lineHeight;
                string discountText = Encoding.UTF8.GetString(Encoding.Default.GetBytes("İndirim: " + orderData.Discount + "TL"));
                Font totalFont = new Font("Poppins", 10, FontStyle.Bold | FontStyle.Underline);
                SizeF totalSize = graphics.MeasureString("TOPLAM: " + orderData.TotalCost + "TL", totalFont);
                SizeF discountSize = graphics.MeasureString(discountText, new Font("Poppins", 8));
                graphics.DrawString(discountText, new Font("Poppins", 8), printBrush, new PointF(paperWidth - discountSize.Width - 5, yPosition));
                yPosition += lineHeight;
                graphics.DrawString("TOPLAM: " + orderData.TotalCost + "TL", totalFont, printBrush, new PointF(paperWidth - totalSize.Width - 5, yPosition));

                // Teşekkür mesajını yazdırma
                yPosition += lineHeight * 2;
                float footerX = (paperWidth - graphics.MeasureString("-- Teşekkür Ederiz --", userFont).Width) / 2;
                graphics.DrawString(Encoding.UTF8.GetString(Encoding.Default.GetBytes("-- Teşekkür Ederiz --")), userFont, printBrush, new PointF(footerX, yPosition));
            };

            try
            {
                printDoc.Print();
            }
            catch (Exception ex)
            {
                throw new Exception($"Print failed: {ex.Message}");
            }
        }

        private void PrintPacketOrder(PacketOrderData orderData)
        {
            PrintDocument printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = "ZJ-58";

            int paperWidthMm = 58; // mm
            int paperHeightMm = 80; // mm
            int dpi = 203;
            printDoc.DefaultPageSettings.PaperSize = new PaperSize("Custom", (int)(paperWidthMm / 25.4 * dpi), (int)(paperHeightMm / 25.4 * dpi));
            printDoc.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);

            printDoc.PrintPage += (sender, e) =>
            {
                Graphics graphics = e.Graphics;
                Font printFont = new Font("Poppins", 8); // Ensure this font supports Turkish characters
                SolidBrush printBrush = new SolidBrush(Color.Black);
                StringFormat format = new StringFormat
                {
                    LineAlignment = StringAlignment.Near,
                    Alignment = StringAlignment.Near,
                    FormatFlags = StringFormatFlags.LineLimit | StringFormatFlags.NoClip
                };

                int yPosition = 0;
                int lineHeight = (int)printFont.GetHeight(graphics) + 5;
                int paperWidth = (int)printDoc.DefaultPageSettings.PrintableArea.Width;

                // Kullanıcı adını yazdırma
                string userName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.UserName));
                Font userFont = new Font("Poppins", 12); // Ensure this font supports Turkish characters
                SizeF userNameSize = graphics.MeasureString(userName, userFont);
                float userNameX = (paperWidth - userNameSize.Width) / 2;

                graphics.DrawString(userName, userFont, printBrush, new PointF(userNameX, yPosition));

                yPosition += lineHeight + 20;

                // Kurye adı ve sipariş tarihi
                graphics.DrawString("Kurye: " + Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.CarrierNameSurname)), printFont, printBrush, new PointF(0, yPosition));
                yPosition += lineHeight;

                graphics.DrawString("Tarih: " + orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss"), printFont, printBrush, new PointF(0, yPosition));

                yPosition += lineHeight + 10;

                foreach (var item in orderData.Orders)
                {
                   
                    string productName = item.productName.Length > 20 ?
                                         item.productName.Substring(0, 20) + ".." :
                                         item.productName;
                    productName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(productName));

                    string productPrice = Encoding.UTF8.GetString(Encoding.Default.GetBytes(item.productPrice + " TL"));
                    string quantityText = "x " + item.quantity.ToString();

                    SizeF nameSize = graphics.MeasureString(productName, printFont);
                    SizeF priceSize = graphics.MeasureString(productPrice, printFont);
                    SizeF quantitySize = graphics.MeasureString(quantityText, new Font("Poppins", 10));
                    int leftMargin = 0;
                    float rightMargin = paperWidth - priceSize.Width - 5;

                    graphics.DrawString(productName, printFont, printBrush, new PointF(leftMargin, yPosition));
                    graphics.DrawString(productPrice, printFont, printBrush, new PointF(rightMargin, yPosition));
                    graphics.DrawString(quantityText, printFont, printBrush, new PointF(leftMargin + nameSize.Width + 5, yPosition));

                    if (!string.IsNullOrEmpty(item.productNote))
                    {
                        yPosition += (lineHeight - 5);
                        // Ürün notu
                        RectangleF noteRectangle = new RectangleF(leftMargin, yPosition, paperWidth - leftMargin, lineHeight * 2);
                        graphics.DrawString("*" + item.productNote, printFont, printBrush, noteRectangle, format);
                        yPosition += (lineHeight - 5) * 2;
                    }
                    else
                    {
                        yPosition += lineHeight;
                    }
                }


                // Müşteri bilgileri
                graphics.DrawString("Müşteri: " + Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.CustomerNameSurname)), printFont, printBrush, new PointF(0, yPosition));
                yPosition += (lineHeight - 5);

                graphics.DrawString("Telefon: " + Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.CustomerPhoneNumber)), printFont, printBrush, new PointF(0, yPosition));
                yPosition += (lineHeight - 5);

                // Adres
                RectangleF addressRectangle = new RectangleF(0, yPosition, paperWidth, lineHeight * 3); // Gerekirse yüksekliği ayarlayın
                graphics.DrawString("Adres: " + Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.CustomerAdress)), printFont, printBrush, addressRectangle, format);
                yPosition += (lineHeight - 5) * 3; // Yüksekliği ihtiyaca göre ayarlayın

                if (!string.IsNullOrEmpty(orderData.CustomerNote))
                {
                    // Müşteri Notu
                    RectangleF customerNoteRectangle = new RectangleF(0, yPosition, paperWidth, lineHeight * 3); // Gerekirse yüksekliği ayarlayın
                    graphics.DrawString("Not: " + Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.CustomerNote)), printFont, printBrush, customerNoteRectangle, format);
                    yPosition += (lineHeight - 5) * 3;
                }

                // Toplam tutar
                Font totalFont = new Font("Poppins", 10, FontStyle.Bold | FontStyle.Underline); // Ensure this font supports Turkish characters
                SizeF totalSize = graphics.MeasureString("TOPLAM: " + orderData.TotalCost + "TL", totalFont);
                graphics.DrawString("TOPLAM: " + orderData.TotalCost + "TL", totalFont, printBrush, new PointF(paperWidth - totalSize.Width - 5, yPosition));
                yPosition += (lineHeight - 5) * 2;
            };

            try
            {
                printDoc.Print();
            }
            catch (Exception ex)
            {
                throw new Exception($"Print failed: {ex.Message}");
            }
        }

        private void PrintBarcode(BarcodeData orderData)
        {
            PrintDocument printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = "ZJ-58";

            int paperWidthMm = 58; // mm
            int paperHeightMm = 80; // mm
            int dpi = 203;
            printDoc.DefaultPageSettings.PaperSize = new PaperSize("Custom", (int)(paperWidthMm / 25.4 * dpi), (int)(paperHeightMm / 25.4 * dpi));
            printDoc.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);

            printDoc.PrintPage += (sender, e) =>
            {
                Graphics graphics = e.Graphics;
                Font printFont = new Font("Poppins", 8);
                SolidBrush printBrush = new SolidBrush(System.Drawing.Color.Black);

                int yPosition = 0;
                int lineHeight = (int)printFont.GetHeight(graphics);
                int paperWidth = (int)printDoc.DefaultPageSettings.PrintableArea.Width;


                string userName = Encoding.UTF8.GetString(Encoding.Default.GetBytes(orderData.UserName));
                Font userFont = new Font("Poppins", 12);
                SizeF userNameSize = graphics.MeasureString(userName, userFont);
                float userNameX = (paperWidth - userNameSize.Width) / 2;


                graphics.DrawString(userName, userFont, printBrush, new PointF(userNameX, yPosition));

                yPosition += lineHeight + 20;


                graphics.DrawString(orderData.OrderDate.ToString("yyyy-MM-dd HH:mm:ss"), new Font("Poppins", 10), printBrush, new PointF(0, yPosition));

                yPosition += lineHeight + 10;


                foreach (var item in orderData.Products)
                {


                    SizeF nameSize = graphics.MeasureString(Encoding.UTF8.GetString(Encoding.Default.GetBytes(item.Name)), printFont);
                    SizeF priceSize = graphics.MeasureString(item.Price + "TL", printFont);
                    SizeF quantitySize = graphics.MeasureString("x " + item.Amount, new Font("Poppins", 10));


                    int leftMargin = 0;
                    float rightMargin = paperWidth - priceSize.Width - 5;


                    graphics.DrawString(Encoding.UTF8.GetString(Encoding.Default.GetBytes(item.Name)), printFont, printBrush, new PointF(leftMargin, yPosition));

                    graphics.DrawString(item.Price + "TL", printFont, printBrush, new PointF(rightMargin, yPosition));

                    graphics.DrawString("x " + item.Amount, printFont, printBrush, new PointF(leftMargin + nameSize.Width + 5, yPosition));

                    yPosition += lineHeight;
                }


                yPosition += lineHeight;
                Font totalFont = new Font("Poppins", 10, FontStyle.Bold | FontStyle.Underline);
                SizeF totalSize = graphics.MeasureString("TOPLAM: " + orderData.Cost + "TL", totalFont);
                graphics.DrawString("TOPLAM: " + orderData.Cost + "TL", totalFont, printBrush, new PointF(paperWidth - totalSize.Width - 5, yPosition));
                yPosition += lineHeight * 2;
                float footerX = (paperWidth - graphics.MeasureString(Encoding.UTF8.GetString(Encoding.Default.GetBytes("-- Teşekkür Ederiz --")), userFont).Width) / 2;

                graphics.DrawString(Encoding.UTF8.GetString(Encoding.Default.GetBytes("-- Teşekkür Ederiz --")), userFont, printBrush, new PointF(footerX, yPosition));
            };

            try
            {
                printDoc.Print();
            }
            catch (Exception ex)
            {
                throw new Exception($"Print failed: {ex.Message}");
            }
        }

    }

    public class Order
    {
        public string productName { get; set; }
        public int quantity { get; set; }
        public string productPrice { get; set; }
    }
    public class InvoiceOrder
    {
        public string productName { get; set; }
        public int quantity { get; set; }
        public string productPrice { get; set; }
        public string productNote { get; set; }
    }

    public class ReceiptData
    {
        public string UserName { get; set; }
        public string TableName { get; set; }
        public DateTime OrderDate { get; set; }
        public List<Order> Orders { get; set; }
        public string TotalCost { get; set; }
    }
    public class BarcodeProduct
    {
        public string Name { get; set; }
        public string Amount { get; set; }
        public string Price { get; set; }
    }

    public class InvoiceData
    {
        public string UserName { get; set; }
        public string TableName { get; set; }
        public DateTime OrderDate { get; set; }
        public List<InvoiceOrder> Orders { get; set; }
        public string TotalCost { get; set; }
    }
    public class DiscountData
    {
        public string UserName { get; set; }
        public string TableName { get; set; }
        public DateTime OrderDate { get; set; }
        public List<Order> Orders { get; set; }
        public string TotalCost { get; set; }
        public string Discount { get; set; }
    }
    public class PacketOrderData
    {
        public string UserName { get; set; }
        public DateTime OrderDate { get; set; }
        public List<InvoiceOrder> Orders { get; set; }
        public string TotalCost { get; set; }
        public string CustomerNameSurname { get; set; }
        public string CustomerPhoneNumber { get; set; }
        public string CustomerAdress { get; set; }
        public string CustomerNote { get; set; }
        public string CarrierNameSurname { get; set; }
    }
    public class BarcodeData
    {
        public string UserName { get; set; }
        public DateTime OrderDate { get; set; }
        public List<BarcodeProduct> Products { get; set; }
        public string Cost { get; set; }
        
    }
}
