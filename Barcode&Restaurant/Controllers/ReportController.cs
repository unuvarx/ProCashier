using Barcode_Restaurant.Models;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Web;
using System.Web.Mvc;



namespace Barcode_Restaurant.Controllers
{
    public class ReportController : Controller
    {

        private readonly BarcodeRestoEntities _context;

        public ReportController()
        {
            _context = new BarcodeRestoEntities();
        }
        private Users ValidateToken(string token)
        {
            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ConfigurationManager.AppSettings["SecretKey"]));
            var tokenHandler = new JwtSecurityTokenHandler();

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = secretKey,
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var username = jwtToken.Subject;

            var user = _context.Users.FirstOrDefault(u => u.Username == username);
            return user;
        }
        private bool UserIsAuthenticated()
        {
            try
            {
                string token = Request.Cookies["_u"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return false;
                }

                var user = ValidateToken(token);

                if (user == null)
                {
                    return false;
                }
                if (user.Status == 0)
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {

                return false;
            }
        }
        private Users GetUser()
        {
            try
            {
                string token = Request.Cookies["_u"]?.Value;

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                var user = ValidateToken(token);

                return user;
            }
            catch (Exception ex)
            {

                return null;
            }
        }
        private bool IsRemainingResto()
        {
            try
            {

                var user = GetUser();
                if (user == null)
                {
                    return false;
                }

                var restoPacket = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 1);
                if (restoPacket == null)
                {
                    return false;
                }

                TimeSpan remainingRestoUsageTime = restoPacket.RemainingUsageTime - DateTime.Now;
                double remainingRestoSeconds = remainingRestoUsageTime.TotalSeconds;
                if (remainingRestoSeconds <= 1)
                {
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        [HttpGet]

        public ActionResult GetDailyReport()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();

                var packet = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 1);

                if (packet == null)
                {
                    return Json(new { success = false, message = "Packet not found for the user." }, JsonRequestBehavior.AllowGet);
                }

                // Bu günün tarihini al
                DateTime today = DateTime.Today;

                // DayStartTime ve DayEndTime'in tam tarihle birleştirilmesi
                DateTime dayStart = today.Date.Add(packet.DayStartTime);
                DateTime dayEnd = today.Date.Add(packet.DayEndTime);

                // Eğer kapanış saati, açılış saatinden önceyse, dayEnd'i bir sonraki günün sabahına kaydır
                if (packet.DayEndTime < packet.DayStartTime)
                {
                    dayEnd = dayEnd.AddDays(1);
                }

                var tableSales = _context.TableSalesHistory
                    .Where(t => t.UserId == user.UserId && t.OrderClosingDate >= dayStart && t.OrderClosingDate < dayEnd)
                    .Select(t => new
                    {
                        t.HistoryId,
                        t.TableId,
                        t.TableName,
                        t.Orders,
                        t.OrderClosingDate,
                        t.OrderStartingDate,
                        PaymentCash = t.PaymentCash ?? "0",
                        PaymentCard = t.PaymentCard ?? "0",
                        PaymentDiscount = t.PaymentDiscount ?? "0",
                    })
                    .ToList();

                var packetOrders = _context.PacketOrders
                    .Where(p => p.UserId == user.UserId && p.OrderEndDate >= dayStart && p.OrderEndDate < dayEnd && (p.Status == 3 || p.Status == 4))
                    .Select(p => new {
                        p.PacketOrderId,
                        p.CarrierId,
                        p.Orders,
                        p.OrderStartingDate,
                        p.OrderEndDate,
                        CardPaid = p.CardPaid ?? "0",
                        CashPaid = p.CashPaid ?? "0",
                        p.CustomerNote,
                    }).ToList();
                var carriers = _context.Carriers.Select(c => new
                {
                    c.CarrierId,
                    c.NameSurname,
                    CarrierSel = 0
                }).ToList();
                return Json(new { tableSales, packetOrders, carriers }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult Daily()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            return View();
        }
        public ActionResult TableDetail(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }
            var tableOrder = _context.TableSalesHistory.FirstOrDefault(t => t.HistoryId == id);
            if (tableOrder == null || id == null)
            {
                return RedirectToAction("Daily", "Report");
            }

            return View(tableOrder);
        }
        public ActionResult PacketDetail(int? id)
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            var packetOrder = _context.PacketOrders.FirstOrDefault(p => p.PacketOrderId == id);
            if (packetOrder == null || id == null)
            {
                return RedirectToAction("Daily", "Report");
            }

            string customer = _context.Customers.FirstOrDefault(c => c.CustomerId == packetOrder.CustomerId)?.NameSurname;
            ViewBag.Customer = customer;
            string carrier = _context.Carriers.FirstOrDefault(c => c.CarrierId == packetOrder.CarrierId)?.NameSurname;
            ViewBag.Carrier = carrier;
            return View(packetOrder);
        }

        [HttpGet]

        public ActionResult GetHistoricalReport()
        {
            try
            {
                if (!UserIsAuthenticated())
                {
                    return RedirectToAction("Login", "UserAuth");
                }
                if (!IsRemainingResto())
                {
                    return RedirectToAction("BuyPacket", "User");
                }

                var user = GetUser();

                var packet = _context.Packets.FirstOrDefault(p => p.UserId == user.UserId && p.PacketType == 1);

                if (packet == null)
                {
                    return Json(new { success = false, message = "Packet not found for the user." }, JsonRequestBehavior.AllowGet);
                }

                

                var tableSales = _context.TableSalesHistory
                    .Where(t => t.UserId == user.UserId)
                    .Select(t => new
                    {
                        t.HistoryId,
                        t.TableId,
                        t.TableName,
                        t.Orders,
                        t.OrderClosingDate,
                        t.OrderStartingDate,
                        PaymentCash = t.PaymentCash ?? "0",
                        PaymentCard = t.PaymentCard ?? "0",
                        PaymentDiscount = t.PaymentDiscount ?? "0",
                    })
                    .ToList();

                var packetOrders = _context.PacketOrders
                    .Where(p => p.UserId == user.UserId && (p.Status == 3 || p.Status == 4))
                    .Select(p => new {
                        p.PacketOrderId,
                        p.CarrierId,
                        p.Orders,
                        p.OrderStartingDate,
                        p.OrderEndDate,
                        CardPaid = p.CardPaid ?? "0",
                        CashPaid = p.CashPaid ?? "0",
                        p.CustomerNote,
                    }).ToList();
                var carriers = _context.Carriers.Select(c => new
                {
                    c.CarrierId,
                    c.NameSurname
                }).ToList();
                return Json(new { tableSales, packetOrders, carriers }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult Historical()
        {
            if (!UserIsAuthenticated())
            {
                return RedirectToAction("Login", "UserAuth");
            }
            if (!IsRemainingResto())
            {
                return RedirectToAction("BuyPacket", "User");
            }

            return View();
        }
        






    }
}