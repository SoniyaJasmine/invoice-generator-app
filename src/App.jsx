
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  // Tax rates
  const taxRates = {
    general: 0.18,
    materials: 0.28,
    services: 0.12,
  };

  // Invoice details
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    clientName: "",
    clientAddress: "",
  });

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 1,
      description: "",
      quantity: 1,
      price: 0,
      category: "general",
      autoDetected: false,
    },
  ]);

  // Total states
  const [subtotal, setSubtotal] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Update invoice details
  const handleInvoiceChange = (field, value) => {
    setInvoiceDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate item total
  const calculateItemTotal = (quantity, price) => {
    return quantity * price;
  };

  // Auto-detect category
  const autoDetectCategory = (description) => {
    const text = description.toLowerCase();

    if (
      text.includes("cement") ||
      text.includes("steel")
    ) {
      return "materials";
    } else if (text.includes("consulting")) {
      return "services";
    }

    return "general";
  };

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    setInvoiceItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        if (field === "description") {
          const detectedCategory = autoDetectCategory(value);

          return {
            ...item,
            description: value,
            category: detectedCategory,
            autoDetected: true,
          };
        }

        if (field === "category") {
          return {
            ...item,
            category: value,
            autoDetected: false,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  // Add new item
  const addNewItem = () => {
    const newItem = {
      id: Date.now(),
      description: "",
      quantity: 1,
      price: 0,
      category: "general",
      autoDetected: false,
    };

    setInvoiceItems((prevItems) => [
      ...prevItems,
      newItem,
    ]);
  };

  // Remove item
  const removeItem = (id) => {
    setInvoiceItems((prevItems) =>
      prevItems.filter((item) => item.id !== id)
    );
  };

  // Calculate subtotal, GST and grand total
  useEffect(() => {
    let calculatedSubtotal = 0;
    let calculatedGST = 0;

    invoiceItems.forEach((item) => {
      const itemTotal = calculateItemTotal(
        item.quantity,
        item.price
      );

      calculatedSubtotal += itemTotal;

      calculatedGST +=
        itemTotal * taxRates[item.category];
    });

    setSubtotal(calculatedSubtotal);
    setTotalGST(calculatedGST);
    setGrandTotal(calculatedSubtotal + calculatedGST);

  }, [invoiceItems]);

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    // Invoice heading
    doc.setFontSize(22);
    doc.text("INVOICE", 14, 20);

    doc.setFontSize(11);

    // Invoice details
    doc.text(
      `Invoice Number: ${invoiceDetails.invoiceNumber}`,
      14,
      35
    );

    doc.text(
      `Invoice Date: ${invoiceDetails.invoiceDate}`,
      14,
      43
    );

    // Client information
    doc.setFontSize(14);
    doc.text("Client Information", 14, 58);

    doc.setFontSize(11);

    doc.text(
      `Client Name: ${invoiceDetails.clientName}`,
      14,
      68
    );

    const addressLines = doc.splitTextToSize(
      `Client Address: ${invoiceDetails.clientAddress}`,
      180
    );

    doc.text(addressLines, 14, 76);

    // Prepare table data
    const tableData = invoiceItems.map((item) => [
      item.description,
      item.quantity.toString(),
      item.price.toFixed(2),
      item.category,
      calculateItemTotal(
        item.quantity,
        item.price
      ).toFixed(2),
    ]);

    // Generate invoice table
    autoTable(doc, {
      startY: 95,
      head: [
        [
          "Description",
          "Qty",
          "Price",
          "Category",
          "Total",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [47, 79, 79],
      },
    });

    // Calculate totals position
    const finalY = doc.lastAutoTable.finalY + 15;

    // Invoice totals
    doc.setFontSize(11);

    doc.text(
      `Subtotal: INR ${subtotal.toFixed(2)}`,
      140,
      finalY
    );

    doc.text(
      `Total GST: INR ${totalGST.toFixed(2)}`,
      140,
      finalY + 8
    );

    doc.setFontSize(14);

    doc.text(
      `Grand Total: INR ${grandTotal.toFixed(2)}`,
      140,
      finalY + 20
    );

    // Save PDF
    doc.save("invoice.pdf");
  };

  return (
    <div className="invoice-container">

      <h1>Invoice Generator</h1>

      {/* Invoice Header */}
      <div className="invoice-header">

        <div>
          <label>Invoice Number</label>

          <input
            type="text"
            placeholder="Enter Invoice Number"
            value={invoiceDetails.invoiceNumber}
            onChange={(e) =>
              handleInvoiceChange(
                "invoiceNumber",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <label>Invoice Date</label>

          <input
            type="date"
            value={invoiceDetails.invoiceDate}
            onChange={(e) =>
              handleInvoiceChange(
                "invoiceDate",
                e.target.value
              )
            }
          />
        </div>

      </div>

      {/* Client Information */}
      <div className="client-section">

        <h2>Client Information</h2>

        <div>
          <label>Client Name</label>

          <input
            type="text"
            placeholder="Enter Client Name"
            value={invoiceDetails.clientName}
            onChange={(e) =>
              handleInvoiceChange(
                "clientName",
                e.target.value
              )
            }
          />
        </div>

        <div>
          <label>Client Address</label>

          <textarea
            placeholder="Enter Client Address"
            value={invoiceDetails.clientAddress}
            onChange={(e) =>
              handleInvoiceChange(
                "clientAddress",
                e.target.value
              )
            }
          />
        </div>

      </div>

      {/* Invoice Items */}
      <div className="items-section">

        <h2>Invoice Items</h2>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Category</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {invoiceItems.map((item) => (

              <tr key={item.id}>

                <td>
                  <input
                    type="text"
                    placeholder="Item Description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "price",
                        Number(e.target.value)
                      )
                    }
                  />
                </td>

                <td>
                  <select
                    value={item.category}
                    onChange={(e) =>
                      handleItemChange(
                        item.id,
                        "category",
                        e.target.value
                      )
                    }
                  >
                    {Object.keys(taxRates).map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>

                  {item.autoDetected && (
                    <small>Auto-detected</small>
                  )}
                </td>

                <td>
                  {calculateItemTotal(
                    item.quantity,
                    item.price
                  ).toFixed(2)}
                </td>

                <td>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={invoiceItems.length === 1}
                  >
                    Remove
                  </button>
                </td>

              </tr>

            ))}
          </tbody>
        </table>

        <button onClick={addNewItem}>
          Add New Item
        </button>

      </div>

      {/* Invoice Summary */}
      <div
        className="invoice-summary"
        style={{
          backgroundColor: "#f0f4f4",
          padding: "25px",
          border: "1px solid #cbd5d5",
          borderRadius: "12px",
          marginTop: "30px",
        }}
      >

        <h2>Invoice Summary</h2>

        <div>
          <p>
            <strong>Invoice Number:</strong>{" "}
            {invoiceDetails.invoiceNumber || "Not entered"}
          </p>

          <p>
            <strong>Invoice Date:</strong>{" "}
            {invoiceDetails.invoiceDate || "Not selected"}
          </p>

          <p>
            <strong>Client Name:</strong>{" "}
            {invoiceDetails.clientName || "Not entered"}
          </p>

          <p>
            <strong>Client Address:</strong>{" "}
            {invoiceDetails.clientAddress || "Not entered"}
          </p>
        </div>

        <hr />

        <div>
          <p>
            Subtotal: INR {subtotal.toFixed(2)}
          </p>

          <p>
            Total GST: INR {totalGST.toFixed(2)}
          </p>

          <h3>
            Grand Total: INR {grandTotal.toFixed(2)}
          </h3>
        </div>

      </div>

      {/* Export PDF Button */}
      <button
        onClick={generatePDF}
        style={{
          marginTop: "20px",
          padding: "12px 25px",
          backgroundColor: "#2f4f4f",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Export as PDF
      </button>

    </div>
  );
}

export default App;
