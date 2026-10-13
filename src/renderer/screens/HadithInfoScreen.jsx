import React from 'react';
import TextView from '../components/TextView';

/**
 * HadithInfoScreen
 * Screen wrapper forwarding to the universal TextView component.
 *
 * @param {Object} props
 * @param {Object} props.hadithData - Details of the active Hadith and its collection
 * @param {Function} props.onBack - Callback when back button is pressed
 */
export default function HadithInfoScreen({ hadithData, onBack }) {
  return (
    <TextView
      hadithData={hadithData}
      onBack={onBack}
    />
  );
}
