const { createClient } = require('@supabase/supabase-js');
const multiparty = require('multiparty');
const fs = require('fs');

exports.handler = async function (event) {
  const supabase = createClient(
      process.env.SUPABASE_URL,
          process.env.SUPABASE_KEY
            );

              const form = new multiparty.Form();

                return new Promise((resolve, reject) => {
                    form.parse(event, async (err, fields, files) => {
                          if (err) return resolve({ statusCode: 500, body: JSON.stringify({ error: 'Form parse failed' }) });

                                const file = files.file[0];
                                      const year = fields.year[0];
                                            const quarter = fields.quarter[0];
                                                  const fileBuffer = fs.readFileSync(file.path);
                                                        const fileName = `${year}_${quarter}_${Date.now()}.pdf`;

                                                              const { data: uploadData, error: uploadError } = await supabase
                                                                      .storage
                                                                              .from(process.env.SUPABASE_STORAGE_BUCKET)
                                                                                      .upload(fileName, fileBuffer, { contentType: 'application/pdf' });

                                                                                            if (uploadError) return resolve({ statusCode: 500, body: JSON.stringify({ error: uploadError.message }) });

                                                                                                  const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET}/${fileName}`;

                                                                                                        const { error: dbError } = await supabase
                                                                                                                .from('financial_results')
                                                                                                                        .insert([{ year: parseInt(year), quarter, pdf_url: url, website: 'your-website.com' }]);

                                                                                                                              if (dbError) return resolve({ statusCode: 500, body: JSON.stringify({ error: dbError.message }) });

                                                                                                                                    resolve({ statusCode: 200, body: JSON.stringify({ success: true }) });
                                                                                                                                        });
                                                                                                                                          });
                                                                                                                                          };
                                                                                                                                          