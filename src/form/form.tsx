import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import "./form.css";
import axios from 'axios';
import {FormModel, AddressValidationProps} from '../models/formModel';
// import {validateAddress, AddressValidationProps} from '../validation/validation';

// require('dotenv').config();

export default function Form() {
  // TODO: Replace with frontend URL
  const rootUrl = "http://localhost:8000" // replace with deployed URL in production
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  // TODO: Default value is 0
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [requirePO, setRequirePO] = useState(false);
  // const [addressIsValid, setAddressIsValid] = useState(false);
  const { register, handleSubmit, formState: { errors }, trigger, reset, control, watch } = useForm<FormModel>();

  const onSubmit = async (data: FormModel) => {
    
    // console.log(data);
    const isValid = await trigger(); // trigger validation
    if (isValid) {
      console.log("Form data:")
      console.log(data)

      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "Images" && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      if (data.Images) {
        for (let i = 0; i < data.Images.length; i++) {
          formData.append("Images", data.Images[i]);
        }
      }
      

      axios.post(`${rootUrl}/api/v1/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(response => {
          console.log("Response data:")
          console.log(response.data)
        })
        .catch(error => {
          console.log("There was an error!", error);
        })

      // TODO: uncomment these two lines for production
      // setSubmitted(true);
      // reset();
      // setAddressIsValid(false);
    }
  };

  const addressValidation = async () => {
    const isValid = await trigger(); // trigger validation\

    // validate address
    const street1 = watch('Street_1')
    const street2 = watch('Street_2') ?? ""
    const street3 = watch('Street_3') ?? ""
    const street4 = watch('Street_4') ?? ""
    const city = watch('City')
    const state = watch('State')
    const zip = watch('Zip')
    // const props: AddressValidationProps = {
    //   city: city,
    //   state: state,
    //   zip: zip,
    //   addressLine: [street1, street2, street3, street4]
    // }
    
    // const validationResult = await validateAddress(props)
    // if ("addressComplete" in validationResult['result']['verdict']) {
    //   setAddressIsValid(true)
    // } else {
    //   setAddressIsValid(false)
    // }
    // console.log(validationResult)
    
    // console.log(validationMsg)
    if (isValid) {
      try {
        const validationMsg = await axios.post(`${rootUrl}/api/v1/validateAddress`, {
          "city": city,
          "state": state,
          "zip": zip,
          "addressLine": [street1, street2, street3, street4]
        })
        
        if (validationMsg.status === 200) {
          console.log("Address Validation API is OK");
          if (validationMsg.data && validationMsg.data.result && validationMsg.data.result.verdict && validationMsg.data.result.verdict.addressComplete) {
            console.log("addressComplete attribute is present.");
            // const response = await axios.post(`${rootUrl}/api/v1/latlng`, {
            //   "city": city,
            //   "state": state,
            //   "zip": zip,
            //   "addressLine": [street1, street2, street3, street4]
            // })
            // console.log(response)
            // setAddressIsValid(true)
            setStep((prevStep) => prevStep + 1);
            window.scrollTo(0, 0);
          } else {
            console.log("addressComplete attribute is NOT present.");
            alert("Address is not valid, double check your input")
          }
        } else {
          console.log("Address Validation API is NOT OK");
          alert("Error. Address validation API call failed with error code 4xx")
        }
        // if (addressIsValid) {
        //   setStep((prevStep) => prevStep + 1);
        //   window.scrollTo(0, 0);
        // } else {
        //   alert("Address is not valid, double check your input")
        // }
      } catch (error) {
        alert(`Error. Address validation API call failed with error ${error}`)
      }
    }
  };

  const nextPage = async () => {
    const isValid = await trigger(); // trigger validation
    if (isValid) {
      setStep((prevStep) => prevStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const back = async () => {
    setStep((prevStep) => prevStep - 1);
    window.scrollTo(0, 0);
  };

  const home = async () => {
    setStep(0);
  };

  const newRequest = async () => {
    setStep(0);
    setSubmitted(false)
    setRequirePO(false)
    setSelectedFiles(null)
  };

  const isResidential = async () => {
    setStep(-1);
  };

  const appDownload = async () => {
    setStep(-2);
  };

  interface ImageUploaderProps {
    onChange: (files: FileList | null) => void;
    value?: FileList | null;
  }

  const ImageUploader: React.FC<ImageUploaderProps> = ({ onChange, value }) => {
    return (
      <div className="file-upload">
        <p className="file-upload-info">Select images from your device, up to 5 images</p>
        <p className="file-upload-info">Currently selected:  <span>{selectedFiles?.length === undefined ? 0 : selectedFiles?.length}</span></p>
        
        {value && Array.from(value).map((file, index) => (
          <img 
            key={index} 
            src={URL.createObjectURL(file)} 
            alt={`Preview ${index}`}
            className='file-upload-preview' 
          />
        ))}
        
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 5) {
              alert('You can select a maximum of 5 images only.');
              return; 
            }
            onChange(files);
            setSelectedFiles(files);
          }}
          className="file-upload-input"
        />
        <label htmlFor="file-upload" className="file-upload-label">
          <i className="fa-solid fa-upload fa-2xl" style={{"color": "#ffffff"}}></i>
        </label>
      </div>
    );
  };

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      
      {/* <button type="button" onClick={test}>Test</button> */}
      <div className="form-content">
        { submitted ? <div className='form-section'>
          <h3 className='subTitle'>Thank you, your request has been recorded</h3>
          <p>Our agents will reach out soon.</p>
          <div className="nav-buttons">
            <button className='form-button backToHome' type="button" onClick={newRequest}>Home</button>
          </div>
        </div>
         : <>
      {step === -1 && (
        <div className='form-section'>
          <h3 className='subTitle'>We are sorry we could not assist you. We only provide service to commercial locations. If you are a commercial location, click the button to go back.</h3>
          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={home}>Back</button>
          </div>
        </div>
      )}

      {step === -2 && (
        <div className='form-section'>
          <h3 className='subTitle'>Please download DNAS Connect to proceed, this web form is for non-contract customers only.</h3>
          <p>"DNAS Connect" is available for download for both iOS and Android devices</p>
          <div className='qr-codes'>
            <div className='qr-code-container'>
              <img className='qr-code' src={process.env.PUBLIC_URL + '/img/dnas-connect-apple.png'} alt='app store qr code'/>
              <p><i className="fa-brands fa-app-store-ios"></i>   App Store</p>
              <a className='app-store-button' href='https://apps.apple.com/us/app/dnas-lite/id1531944898'>
               <i className="fa-brands fa-apple"></i>   Get it on App Store
              </a>
            </div>
            
            <div className='qr-code-container'>
              <img className='qr-code' src={process.env.PUBLIC_URL + '/img/dnas-connect-google.png'} alt='play store qr code'/>
              <p><i className="fa-brands fa-google-play"></i>   Google Play</p>
              <a className='app-store-button' href='https://play.google.com/store/apps/details?id=com.dayniteit.dnaslite&pcampaignid=web_share'>
               <i className="fa-brands fa-google-play"></i>   Get it on Google Play
              </a>
            </div>
          </div>
          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={home}>Back</button>
          </div>
        </div>
      )}

      {step === 0 && (
        <div className='form-section'>
          <img src={process.env.PUBLIC_URL + '/img/dnas-logo.png'} alt='DNAS Logo' />
          <h1 className='title'>Welcome to DNAS Non-Contract Customer Service Request Form</h1>
          <h3 className='subTitle'>Day & Nite / All Service / Popular Plumbing</h3>
          <h4 className='subTitle'>Visit our website to learn more about us <a href="https://www.wearetheone.com">www.wearetheone.com</a></h4>
          <p>Are you requesting service for a residential or commercial location?</p>
          <div className="nav-buttons">
            <button className='form-button commercial' type="button" onClick={nextPage}>Commercial</button>
            <button className='form-button residential' type="button" onClick={isResidential}>Residential</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className='form-section'>
          <h3 className='subTitle'>Do you have a DNAS Connect Account?</h3>
          
          <div className="nav-buttons">
            <button className='form-button yes' type="button" onClick={appDownload}>Yes</button>
            <button className='form-button No' type="button" onClick={nextPage}>No</button>
          </div>
        </div>
      )}  

      {step === 2 && (
        <div className='form-section'>
          <h1 className='title'>Site Address</h1>
          <p>Street 1 <span className='required'>*</span></p>
          <input className="input text" type="text" placeholder="Street 1" {...register("Street_1", { required: true })} />
          {errors['Street_1'] && errors['Street_1'].type === 'required' && <p style={{ color: 'red' }}>Street 1 is required.</p>}

          <p>Street 2</p>
          <input className="input text" type="text" placeholder="Street 2" {...register("Street_2")} />

          <p>Street 3</p>
          <input className="input text" type="text" placeholder="Street 3" {...register("Street_3")} />

          <p>Street 4</p>
          <input className="input text" type="text" placeholder="Street 4" {...register("Street_4")} />

          <p>City <span className='required'>*</span></p>
          <input className="input text" type="text" placeholder="City" {...register("City", { required: true })} />
          {errors['City'] && errors['City'].type === 'required' && <p style={{ color: 'red' }}>City is required.</p>}

          <p>State <span className='required'>*</span></p>
          <input className="input text" type="text" placeholder="State" {...register("State", { 
            required: "State is required.",
            pattern: {
              value: /^[A-Z]{2}$/,
              message: "State must be 2 captialized letters."
            }  
          })} />
          {errors['State'] && <p style={{ color: 'red' }}>{errors['State'].message}</p>}
          {/* {errors['State'] && errors['State'].type === 'pattern' && <p style={{ color: 'red' }}>{errors['State'].message}</p>} */}

          <p>Zip Code <span className='required'>*</span></p>
          <input className="input number" type="text" placeholder="Zip Code" {...register("Zip", { 
            required: "Zip Code is required.",
            pattern: {
              value: /^\d{5}$/,
              message: "Zip Code must be a 5-digit number."
            }
          })} />
          {errors['Zip'] && <p style={{ color: 'red' }}>{errors['Zip'].message}</p>}
          {/* {errors['Zip'] && errors['Zip'].type === 'pattern' && <p style={{ color: 'red' }}>{errors['Zip'].message}</p>} */}
          {/* {errors['Zip'] && errors['Zip'].type === 'required' && <p style={{ color: 'red' }}>Zip is required.</p>} */}

          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={back}>Back</button>
            <button className='form-button next' type="button" onClick={addressValidation}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className='form-section'>
          <h1 className='title'>Contact Person Details</h1>
          <p>First Name <span className='required'>*</span></p>
          <input className="input text" type="text" placeholder="First Name" {...register("First_Name", {required: true})} />
          {errors['First_Name'] && errors['First_Name'].type === 'required' && <p style={{ color: 'red' }}>First Name is required.</p>}

          <p>Last Name</p>
          <input className="input text" type="text" placeholder="Last Name" {...register("Last_Name", {})} />

          <p>Email Address <span className='required'>*</span></p>
          <input className="input text" type="text" placeholder="Email Address" {...register("Email_Address", {required: true})} />
          {errors['Email_Address'] && errors['Email_Address'].type === 'required' && <p style={{ color: 'red' }}>Email Address is required.</p>}

          <p>Phone Number <span className='required'>*</span></p>
          <input className="input number" type="number" placeholder="Phone Number" {...register("Phone_Number", {required: true})} />
          {errors['Phone_Number'] && errors['Phone_Number'].type === 'required' && <p style={{ color: 'red' }}>Phone Number is required.</p>}

          <p>Phone Number Ext.</p>
          <input className="input number" type="number" placeholder="Ext" {...register("Phone_Number_Ext", {})} />

          <p>Alternative Phone Number</p>
          <input className="input number" type="number" placeholder="Alternative Phone Number" {...register("Alternative_Phone_Number", {})} />

          <p>Alternative Phone Number Ext.</p>
          <input className="input number" type="number" placeholder="Ext" {...register("Alternative_Phone_Number_Ext", {})} />
          
          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={back}>Back</button>
            <button className='form-button next' type="button" onClick={nextPage}>Next</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className='form-section'>
          <h1 className='title'>Equipment Information</h1>
          <p>Manufacturer</p>
          <input className="input text" type="text" placeholder="Manufacturer" {...register("Manufacturer", {})} />
          
          <p>Model</p>
          <input className="input text" type="text" placeholder="Model" {...register("Model", {})} />

          <p>Under Manufacturer Warranty?</p>
          <select className="select" defaultValue="-" {...register("Under_Manufacturer_Warranty")}>
            <option value="-"></option>
            <option value="Yes">Yes</option>
            <option value="No"> No</option>
          </select>

          <p>Has the equipment been serviced in the last 30 days?</p>
          <select className="select" defaultValue="-" {...register("Recently_Serviced")}>
            <option value="-"></option>
            <option value="Yes">Yes</option>
            <option value="No"> No</option>
          </select>

          <p>If yes, enter relevant Information:</p>
          <textarea className="input textarea" {...register("Service_Info", {})} />

          <p>Do you require a purchase order number?</p>
          <select className="select" defaultValue="-" {...register("Require_PO_number")} onChange={(e) => {
            const value = e.target.value;
            if (value === "Yes") {
              setRequirePO(true);
            } else {
              setRequirePO(false);
            }
          }}>
            <option value="-"></option>
            <option value="Yes">Yes</option>
            <option value="No"> No</option>
          </select>

          <p>Purchase Order Number {requirePO && <span className='required'>*</span>}</p>
          <input className="input text" type="text" placeholder="Purchase Order Number" {...register("Purchase_Order_Number", {required: requirePO})} />
          {errors['Purchase_Order_Number'] && errors['Purchase_Order_Number'].type === 'required' && <p style={{ color: 'red' }}>Purchase Order Number is required.</p>}

          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={back}>Back</button>
            <button className='form-button next' type="button" onClick={nextPage}>Next</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className='form-section'>
          <h1 className='title'>Service Requirements</h1>
          <p>Exact Location (Instructions of access) <span className='required'>*</span></p>
          <input className="input text" type="text" placeholder="Location" {...register("Location", {required: true})} />
          {errors['Location'] && errors['Location'].type === 'required' && <p style={{ color: 'red' }}>Exact Location (Instructions of access) is required.</p>}


          <p>Equipment Type <span className='required'>*</span></p>
          <select className="select" {...register("Type", { required: true })}>
            <option value="" disabled selected hidden>Select an option...</option>
            <option value="Refrigeration">Refrigeration</option>
            <option value="HVAC">HVAC</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Plumbing">Plumbing</option>
          </select>
          {errors['Type'] && errors['Type'].type === 'required' && <p style={{ color: 'red' }}>Equipment Type is required.</p>}

          <p>Description of Problem <span className='required'>*</span></p>
          <textarea className="input textarea" {...register("Description", {required: true})} />
          {errors['Description'] && errors['Description'].type === 'required' && <p style={{ color: 'red' }}>Description of Problem is required.</p>}
          
          <p>Upload Images</p>
          
          <Controller
            name="Images"
            control={control}
            defaultValue={null}
            render={({ field }) => (
              <ImageUploader onChange={field.onChange} value={field.value} />
            )}
          />

          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={back}>Back</button>
            <button className='form-button next' type="button" onClick={nextPage}>Next</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className='form-section'>
          <h1 className='title'>Availability</h1>
          <p>Preferred Date <span className='required'>*</span></p>
          <input className="input date" type="date" placeholder="Preferred Date" {...register("Preferred_Date", {required: true})} />
          {errors['Preferred_Date'] && errors['Preferred_Date'].type === 'required' && <p style={{ color: 'red' }}>Preferred Date is required.</p>}

          <p>Preferred Time <span className='required'>*</span></p>
          <select className="select" {...register("Preferred_Time", { required: true })}>
            <option value="" disabled selected hidden>Select an option...</option>
            <option value="6-9">6-9</option>
            <option value="9-12">9-12</option>
            <option value="12-2:30">12-2:30</option>
          </select>
          {errors['Preferred_Time'] && errors['Preferred_Time'].type === 'required' && <p style={{ color: 'red' }}>Preferred Time is required.</p>}

          <p>O/T Approved</p>
          <select className="select" defaultValue="-" {...register("OT_Approved")}>
            <option value="-"></option>
            <option value="Yes">Yes</option>
            <option value="No"> No</option>
          </select>

          <p>Additional Comments</p>
          <textarea className="input textarea" {...register("Comments", {})} />

          <div className="nav-buttons">
            <button className='form-button back' type="button" onClick={back}>Back</button>
            <input className='form-button submit' type="submit" value="Submit" />
          </div>
        </div>
      )}

      {Object.keys(errors).length > 0 && step >= 2 && (
        <p className='error'>Please correct errors.</p>
      )}
      </>
      }

      </div>
    </form>
  );
}
