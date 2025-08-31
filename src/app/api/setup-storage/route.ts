import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting Supabase Storage setup...');

    // Create the storage bucket
    console.log('📦 Creating storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('wingman-files', {
        public: true
      });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating bucket:', bucketError);
      throw bucketError;
    }

    console.log('✅ Storage bucket created or already exists');

    // Check if bucket exists and is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const wingmanBucket = buckets.find(bucket => bucket.id === 'wingman-files');
    
    if (!wingmanBucket) {
      throw new Error('Bucket was not created successfully');
    }

    console.log('✅ Bucket verification successful');

    // Test upload to verify permissions
    console.log('🧪 Testing bucket upload permissions...');
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testPath = 'test-setup/test.txt';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wingman-files')
      .upload(testPath, testContent, {
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
      // This might fail due to RLS policies, which is expected
      console.log('ℹ️ Upload test failed (expected if RLS policies are strict)');
    } else {
      console.log('✅ Test upload successful');
      
      // Clean up test file
      await supabase.storage
        .from('wingman-files')
        .remove([testPath]);
    }

    // Get bucket details
    const { data: bucketInfo } = await supabase.storage
      .from('wingman-files')
      .list('', { limit: 1 });

    console.log('🎉 Supabase Storage setup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Supabase Storage setup completed successfully',
      bucket: {
        id: wingmanBucket.id,
        name: wingmanBucket.name,
        public: wingmanBucket.public,
        createdAt: wingmanBucket.created_at,
        updatedAt: wingmanBucket.updated_at
      },
      testUpload: uploadError ? 'Failed (RLS policies may be restrictive)' : 'Success',
      endpoints: {
        upload: '/api/upload-supabase',
        bucketUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/wingman-files/`
      },
      supportedFileTypes: {
        videos: ['mp4', 'webm', 'mov', 'avi'],
        documents: ['pdf', 'docx', 'doc'],
        presentations: ['pptx', 'ppt', 'ppsx'],
        images: ['jpeg', 'jpg', 'png', 'webp']
      }
    });

  } catch (error) {
    console.error('💥 Error setting up Supabase Storage:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to setup Supabase Storage',
        details: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: {
          common_issues: [
            'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables',
            'Ensure service role key has storage admin permissions',
            'Verify Supabase project is active and accessible'
          ]
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check current storage setup status
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const wingmanBucket = buckets.find(bucket => bucket.id === 'wingman-files');
    
    if (!wingmanBucket) {
      return NextResponse.json({
        setup: false,
        message: 'Storage bucket not found. Run POST /api/setup-storage to create it.',
        bucket: null
      });
    }

    // Test bucket access
    const { data: bucketFiles, error: accessError } = await supabase.storage
      .from('wingman-files')
      .list('', { limit: 1 });

    return NextResponse.json({
      setup: true,
      message: 'Storage bucket exists and is accessible',
      bucket: {
        id: wingmanBucket.id,
        name: wingmanBucket.name,
        public: wingmanBucket.public,
        createdAt: wingmanBucket.created_at,
        updatedAt: wingmanBucket.updated_at
      },
      accessible: !accessError,
      accessError: accessError?.message || null,
      endpoints: {
        upload: '/api/upload-supabase',
        bucketUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/wingman-files/`
      }
    });

  } catch (error) {
    console.error('Error checking storage setup:', error);
    
    return NextResponse.json(
      { 
        setup: false,
        error: 'Failed to check storage setup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
