import { useState } from 'react';
import { uploadPDF } from '../services/api';
import useApi from './useApi';

const useUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { loading, error, request, clearError } = useApi();

  const uploadFile = async (file, onSuccess, onError) => {
    const formData = new FormData();
    formData.append('pdf', file);

    await request(
      () => uploadPDF(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      }),
      onSuccess,
      onError
    );
  };

  return {
    uploadFile,
    uploadProgress,
    loading,
    error,
    clearError
  };
};

export default useUpload;