import { useCallback, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { Button } from '../ui/button';
import { convertFileToUrl } from '@/lib/utils';

type FileUploaderProps = {
  fieldChange: (FILES: File[]) => void;
  mediaUrl: string;
}

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
  const [file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState(mediaUrl);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFile(acceptedFiles);
    fieldChange(acceptedFiles);
    setFileUrl(convertFileToUrl(acceptedFiles[0]));
  }, [file]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpeg', '.jpg', '.svg'],
      'video/*': ['.mp4', '.webm', '.ogg'] // Allow videos
    }
  });

  return (
    <div {...getRootProps()} className='flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer'>
      <input {...getInputProps()} className='cursor-pointer' />
      {fileUrl ? (
        <>
          <div className='flex flex-1 justify-center w-full p-5 lg:p-10'>
            {/* Check if fileUrl indicates a video (basic check extension or mime type if available) */}
            {fileUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || (file[0]?.type?.startsWith('video/')) ? (
              <video src={fileUrl} controls className='file_uploader-img max-h-[400px]' />
            ) : (
              <img src={fileUrl} alt="image" className='file_uploader-img' />
            )}
          </div>
          <p className='file_uploader-label'>Click or drag photo/video to replace</p>
        </>
      ) : (
        <div className='file_uploader-box'>
          <img src="/assets/icons/file-upload.svg" width={96} height={77} alt="file-upload" />
          <h3 className='base-medium test-light-2 mb-2 mt-6'>Drag photo or video here</h3>
          <p className='text-light-4 small-regular mb-6'>SVG, PNG, JPG, MP4</p>
          <Button className='shad-button_dark_4'>Select from device</Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;