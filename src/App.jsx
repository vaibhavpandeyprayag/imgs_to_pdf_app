import "./App.css";
import { useState } from "react";
import pdfIcon from "./assets/pdf.png";
import appLogo from "./assets/app-logo.png";
import { PDFDocument, rgb } from "pdf-lib";
import imageCompression from "browser-image-compression";
const App = () => {
  const [loading, setLoading] = useState(false);
  const [appPristine, setAppPristine] = useState(true);
  const [screenAnimation, setScreenAnimation] = useState(true);
  const [imgList, setImgList] = useState([]);
  const [compressLevel, setCompressLevel] = useState(50);
  const [pdfGenerated, setPdfGenerated] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfDetail, setPdfDetail] = useState(null);

  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  // Compress image to reduce size
  const compressImage = async (blob, compressLevel) => {
    // Compress image using browser-image-compression
    console.log("maxSizeMB >>", (1 / compressLevel).toFixed(2));
    const compressedBlob = await imageCompression(blob, {
      maxSizeMB: (1 / compressLevel).toFixed(2), // Set max size to 1MB
      maxWidthOrHeight: 1000, // Optionally resize image to fit within a size
      useWebWorker: true,
    });

    // Convert compressed blob back to base64
    const compressedBase64 = await blobToBase64(compressedBlob);
    return compressedBase64;
  };

  // Convert Blob to base64
  const blobToBase64 = blob => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Create a PDF from base64 images
  const createPdfFromBase64Images = async imgs => {
    setLoading(true);
    const pdfDoc = await PDFDocument.create();

    for (const img of imgs) {
      const compressedBase64Image = await compressImage(
        img.file,
        compressLevel
      ); // Adjust quality as needed

      // Convert the base64 image to a byte array
      const imageBytes = await fetch(compressedBase64Image).then(res =>
        res.arrayBuffer()
      );

      let image;
      if (compressedBase64Image.includes("data:image/png")) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      const imageWidth = image.width;
      const imageHeight = image.height;

      const scale = Math.min(A4_WIDTH / imageWidth, A4_HEIGHT / imageHeight);

      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;

      const x = (A4_WIDTH - scaledWidth) / 2;
      const y = (A4_HEIGHT - scaledHeight) / 2;

      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      page.drawImage(image, { x, y, width: scaledWidth, height: scaledHeight });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    const pdfSizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
    console.log(`Generated PDF size: ${pdfSizeInMB} MB`);

    // Check if PDF is larger than 1MB, if so, retry with smaller image compression
    if (blob.size > 1024 * 1024) {
      console.log(
        "PDF is larger than 1MB. Consider further compression or reducing image resolution."
      );
    }

    setPdfBlob(() => blob);
    setPdfDetail(() => {
      return {
        sizeInMB: pdfSizeInMB,
      };
    });
    setPdfGenerated(() => true);
    setLoading(false);
    // You can now offer the PDF to the user for download
  };

  const downloadPdf = () => {
    const link = document.createElement("a");
    link.id = "download-link";
    link.href = URL.createObjectURL(pdfBlob);
    const now = new Date();
    const todayArr = now.toLocaleDateString().split("/");
    const fileName = `PDF-${todayArr[2]}${todayArr[0].padStart(
      2,
      "0"
    )}${todayArr[1].padStart(2, "0")}-${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
    link.download = `${fileName}.pdf`;
    link.click();
    link.remove();
  };

  const removePhoto = index => {
    setImgList(prev => prev.filter((_, i) => i != index));
  };

  return (
    <div className={"body"}>
      {loading && (
        <div className={"loader-container"}>
          <div className={"loader"}></div>
        </div>
      )}
      {appPristine && (
        <div className={`intro-screen ${screenAnimation ? "show" : "hide"}`}>
          <div className={"logo-container"}>
            <img src={appLogo} alt={"logo"} style={{ width: "50%" }} />
          </div>
          <div className={"intro-container"}>
            <h1>Photos To PDF</h1>
            <p
              style={{
                marginTop: "2rem",
                width: "80%",
                fontWeight: "bold",
              }}
            >
              Easily convert your photos into a single PDF with just a few taps.
            </p>
            <p
              style={{
                marginTop: "1rem",
                width: "80%",
                fontWeight: 500,
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              Developed by Vaibhav Pandey
            </p>
            <button
              className={"glassy-button"}
              style={{ marginTop: "2rem" }}
              onClick={() => {
                setScreenAnimation(prev => false);
                setTimeout(() => {
                  setAppPristine(prev => false);
                  setScreenAnimation(prev => true);
                  setTimeout(() => setScreenAnimation(prev => false), 500); // after animation, show main
                }, 500);
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      {appPristine != true && (
        <div className={`main-screen ${screenAnimation ? "hide" : "show"}`}>
          <div className="control-container">
            {
              <div className="add-convert-controls">
                <div className="add-convert-controls-container">
                  <button
                    className="glassy-button"
                    style={{ width: "100%" }}
                    onClick={() => {
                      document.querySelector("#add-photos-input").click();
                    }}
                  >
                    Add Photos
                  </button>
                  <input
                    type={"file"}
                    multiple
                    accept="image/*"
                    id={"add-photos-input"}
                    style={{ display: "none" }}
                    onChange={event => {
                      const files = Array.from(event.target.files).map(
                        file => ({
                          file: file,
                          url: URL.createObjectURL(file),
                        })
                      );
                      console.log(files);
                      setImgList(prev => [...prev, ...files]);
                      return () => {
                        files.forEach(({ url }) => URL.revokeObjectURL(url));
                      };
                    }}
                  />
                  {imgList && imgList.length > 0 && (
                    <>
                      <h4 style={{ textAlign: "start" }}>
                        Compression level ({compressLevel})
                      </h4>
                      <div style={{ width: "100%" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <label>1</label>
                          <label>100</label>
                        </div>
                        <input
                          style={{ width: "100%" }}
                          type={"range"}
                          min={1}
                          max={100}
                          value={compressLevel}
                          onChange={event => {
                            setCompressLevel(event.target.value);
                          }}
                        />
                      </div>
                      <button
                        className="glassy-button"
                        style={{ width: "100%" }}
                        onClick={() => {
                          createPdfFromBase64Images(imgList);
                        }}
                      >
                        Generate PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            }
            {pdfGenerated == true && (
              <div className={"pdf-generated-section"}>
                <div className={"pdf-generated-container"}>
                  <div style={{ padding: "1rem" }}>
                    <img
                      src={pdfIcon}
                      alt="pdf"
                      style={{ width: "40px", height: "40px" }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                    }}
                  >
                    <h3
                      style={{
                        fontWeight: "bold",
                      }}
                    >
                      PDF Generated
                    </h3>
                    <label>
                      {pdfDetail?.sizeInMB ? `${pdfDetail?.sizeInMB} MB` : ""}
                    </label>
                  </div>
                  <div style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                    <button
                      className={"glassy-button"}
                      style={{ width: "100%" }}
                      onClick={() => {
                        downloadPdf();
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div style={{ padding: "1rem" }}>
                  <button
                    className={"glassy-button"}
                    style={{ width: "100%" }}
                    onClick={() => {
                      imgList.forEach(({ url }) => URL.revokeObjectURL(url));
                      setImgList([]);
                      setCompressLevel(50);
                      setPdfGenerated(null);
                      setPdfBlob(null);
                      setPdfDetail(null);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="divider-section">
            <div className={"divider"}></div>
          </div>
          <div className="img-list-section">
            {(imgList == null || imgList.length == 0) && (
              <div className={"no-img-selected"}>
                <h4
                  style={{
                    fontSize: "20px",
                    color: "lightgrey",
                    fontStyle: "italic",
                  }}
                >
                  No images selected
                </h4>
              </div>
            )}
            {imgList && imgList.length > 0 && (
              <>
                <h4
                  style={{
                    fontWeight: "bold",
                    paddingTop: "1rem",
                    paddingLeft: "1rem",
                  }}
                >
                  Photos: {imgList.length}
                </h4>
                <div className={"img-list-container"}>
                  {imgList.map((img, index) => {
                    return (
                      <div className="img-container" key={"index" + index}>
                        <img src={img.url} className={"img"} alt={img.name} />
                        <button
                          className={"glassy-danger-button"}
                          onClick={() => {
                            removePhoto(index);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
