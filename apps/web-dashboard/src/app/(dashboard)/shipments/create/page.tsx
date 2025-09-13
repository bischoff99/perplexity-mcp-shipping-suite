'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreateShipmentPage() {
  const [formData, setFormData] = useState({
    toName: '',
    toCompany: '',
    toStreet1: '',
    toCity: '',
    toState: '',
    toZip: '',
    toCountry: 'US',
    fromName: '',
    fromCompany: '',
    fromStreet1: '',
    fromCity: '',
    fromState: '',
    fromZip: '',
    fromCountry: 'US',
    parcelLength: '',
    parcelWidth: '',
    parcelHeight: '',
    parcelWeight: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement MCP client integration
    console.log('Creating shipment:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/shipments" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
            ← Back to Shipments
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Create New Shipment</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new shipment using EasyPost MCP integration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* To Address */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">To Address</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="toName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="toName"
                  id="toName"
                  value={formData.toName}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="toCompany" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  name="toCompany"
                  id="toCompany"
                  value={formData.toCompany}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="toStreet1" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  name="toStreet1"
                  id="toStreet1"
                  value={formData.toStreet1}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="toCity" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="toCity"
                  id="toCity"
                  value={formData.toCity}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="toState" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="toState"
                  id="toState"
                  value={formData.toState}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="toZip" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="toZip"
                  id="toZip"
                  value={formData.toZip}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* From Address */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">From Address</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="fromName"
                  id="fromName"
                  value={formData.fromName}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="fromCompany" className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  name="fromCompany"
                  id="fromCompany"
                  value={formData.fromCompany}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="fromStreet1" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  name="fromStreet1"
                  id="fromStreet1"
                  value={formData.fromStreet1}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fromCity" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="fromCity"
                  id="fromCity"
                  value={formData.fromCity}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fromState" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="fromState"
                  id="fromState"
                  value={formData.fromState}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fromZip" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="fromZip"
                  id="fromZip"
                  value={formData.fromZip}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Parcel Information */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Parcel Information</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-4">
              <div>
                <label htmlFor="parcelLength" className="block text-sm font-medium text-gray-700">
                  Length (in)
                </label>
                <input
                  type="number"
                  name="parcelLength"
                  id="parcelLength"
                  value={formData.parcelLength}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="parcelWidth" className="block text-sm font-medium text-gray-700">
                  Width (in)
                </label>
                <input
                  type="number"
                  name="parcelWidth"
                  id="parcelWidth"
                  value={formData.parcelWidth}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="parcelHeight" className="block text-sm font-medium text-gray-700">
                  Height (in)
                </label>
                <input
                  type="number"
                  name="parcelHeight"
                  id="parcelHeight"
                  value={formData.parcelHeight}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="parcelWeight" className="block text-sm font-medium text-gray-700">
                  Weight (oz)
                </label>
                <input
                  type="number"
                  name="parcelWeight"
                  id="parcelWeight"
                  value={formData.parcelWeight}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
