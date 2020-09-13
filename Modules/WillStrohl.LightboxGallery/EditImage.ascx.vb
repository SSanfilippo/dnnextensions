﻿'
' Copyright Upendo Ventures, LLC
' https://upendoventures.com
' 
' Permission is hereby granted, free of charge, to any person obtaining a copy of this software
' and associated documentation files (the "Software"), to deal in the Software without restriction,
' including without limitation the rights to use, copy, modify, merge, publish, distribute,
' sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
' furnished to do so, subject to the following conditions:
' 
' The above copyright notice and this permission notice shall be included in all copies or
' substantial portions of the Software.
' 
' THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
' BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
' NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
' DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
' OUT OF Or IN CONNECTION WITH THE SOFTWARE Or THE USE Or OTHER DEALINGS IN THE SOFTWARE.
'

Imports Danielyan.Exif
Imports DotNetNuke.Security
Imports DotNetNuke.Services.Exceptions
Imports DotNetNuke.Services.FileSystem
Imports DotNetNuke.UI.Skins.Skin
Imports System.Drawing
Imports System.Text
Imports System.Web.UI
Imports System.Collections.Generic
Imports WillStrohl.Modules.Lightbox.LightboxController

Namespace WillStrohl.Modules.Lightbox

    Partial Public MustInherit Class EditImage
        Inherits WNSPortalModuleBase

#Region " Private Members "

        Private Const IMAGE_FORMAT As String = "<a href=""{0}"" target=""_blank""><img class=""wns-image"" src=""{0}"" alt=""{1}"" title=""{1}""{2} /></a>"

        Private p_ImageId As Integer = Null.NullInteger
        Private p_LightboxId As Integer = Null.NullInteger

#End Region

#Region " Properties "

        Private ReadOnly Property ImageId As Integer
            Get
                If Me.p_ImageId > 0 Then
                    Return Me.p_ImageId
                End If

                Integer.TryParse(Request.QueryString("Image"), Me.p_ImageId)

                Return Me.p_ImageId
            End Get
        End Property

        Private ReadOnly Property LightboxId As Integer
            Get
                If Me.p_LightboxId > 0 Then
                    Return Me.p_LightboxId
                End If

                Integer.TryParse(Request.QueryString("Album"), Me.p_LightboxId)

                Return Me.p_LightboxId
            End Get
        End Property

#End Region

#Region " Event Handlers "

        Private Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
            Try

                If Not Me.ImageId > 0 Then
                    SendToModule()
                End If

                If Not Page.IsPostBack Then
                    Me.BindData()
                End If

                Me.Page.Header.Controls.Add(New LiteralControl(String.Format(STYLESHEET_TAG_FORMAT, String.Concat(Me.ControlPath, "js/jquery-ui-1.8.2.css"))))

            Catch exc As Exception ' Module failed to load
                ProcessModuleLoadException(Me, exc, Me.IsEditable)
            End Try
        End Sub

        Private Sub cmdCancel_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles cmdCancel.Click
            SendToModule()
        End Sub

        Private Sub cmdUpdate_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles cmdUpdate.Click

            If Me.Page.IsValid Then
                SaveImage()
            End If

        End Sub

        Private Sub cmdDelete_Click(sender As Object, e As System.EventArgs) Handles cmdDelete.Click
            Me.DeleteImage()
        End Sub

#End Region

#Region " Private Helper Functions "

        Private Sub BindData()

            LocalizeModule()

            Dim ctlModule As New LightboxController

            Dim oImage As ImageInfo = ctlModule.GetImageById(ImageId)
            Dim oLightbox As LightboxInfo = ctlModule.GetLightbox(LightboxId)

            If Not oImage Is Nothing Then
                txtImageDescription.Text = oImage.Description
                txtImageTitle.Text = oImage.Title
            End If

            Dim strDimensions As String = String.Empty
            Dim imgFile As IFileInfo = ctlModule.GetImageFromProvider(PortalId, oLightbox.GalleryFolder, oImage.FileName)

            If Not imgFile Is Nothing Then

                If imgFile.Width > 500 Then
                    strDimensions = GetDimensions(imgFile)
                End If

                WriteImageMetaData(imgFile)

            Else

                SendToModule()

            End If

            litImage.Text = String.Format(IMAGE_FORMAT, ctlModule.GetImageFileUrl(imgFile), oImage.Title, strDimensions)

            lblFileName.Text = String.Format("{0} &gt; {1}", oLightbox.GalleryName, oImage.FileName)

            cmdDelete.Visible = (ImageId <> Null.NullInteger)

        End Sub

        Private Sub WriteImageMetaData(ByVal img As IFileInfo)

            ' need to determine if the image is in a local folder
            Dim ctlModule As New LightboxController
            Dim oImage As Image = Nothing

            If ctlModule.IsLocalFolder(img) Then
                ' need to grab an image from local or cloud
                ' local can use Image.FromFile
                oImage = Image.FromFile(img.PhysicalPath)
            Else
                ' cloud requires pulling the image from HTTP stream
                Dim extRequest As Net.WebRequest = Net.WebRequest.Create(ctlModule.GetImageFileUrl(img))
                'get the external response 
                Dim extResponse As Net.WebResponse = extRequest.GetResponse
                'get the external responses stream 
                oImage = Image.FromStream(extResponse.GetResponseStream)
                'clear our buffer and set up our response 
                Context.Response.Clear()
                Context.Response.Buffer = False
            End If

            Dim sb As New StringBuilder
            Dim tags As ExifTags = New ExifTags(oImage)

            For Each oProp As KeyValuePair(Of String, ExifTag) In tags

                Select Case oProp.Key
                    Case "PixelXDimension", "PixelYDimension"
                        sb.AppendFormat("<div class=""dnnClear""><label class=""wnsExifTitle wnsExifInline"">{0}:</label>&nbsp; <span class=""Normal wnsExifInline"">{1} px</span></div>", _
                            oProp.Value.Description, _
                            oProp.Value.Value)
                    Case "DateTime", "DateTimeOriginal", "DateTimeDigitized"
                        Dim strDate As String() = Split(oProp.Value.Value, " ")
                        strDate(0) = strDate(0).Replace(":", "/")
                        Try
                            sb.AppendFormat("<div class=""dnnClear""><label class=""wnsExifTitle wnsExifTitle"">{0}:</label>&nbsp; <span class=""Normal wnsExifInline"">{1}</span></div>", _
                                oProp.Value.Description, _
                                DateTime.Parse(String.Concat(strDate(0), " ", strDate(1))))
                        Catch
                            ' Issue 6934:  https://wnslightbox.codeplex.com/workitem/6934
                            ' accounting for other time formats
                            sb.AppendFormat("<div class=""dnnClear""><label class=""wnsExifTitle wnsExifTitle"">{0}:</label>&nbsp; <span class=""Normal wnsExifInline"">{1}</span></div>", _
                                oProp.Value.Description, _
                                DateTime.Parse(strDate(0)))
                        End Try
                    Case "Flash", "ExposureMode", "WhiteBalance", "ShutterSpeedValue", "ApertureValue", "Make", "Model", "Software"
                        sb.AppendFormat("<div class=""dnnClear""><label class=""wnsExifTitle wnsExifTitle"">{0}:</label>&nbsp; <span class=""Normal wnsExifInline"">{1}</span></div>", _
                            oProp.Value.Description, _
                            oProp.Value.Value)
                End Select

                '*** for debug only - shows all possible properties ***
                'sb.AppendFormat("<div class=""dnnClear""><span class=""SubHead wnsExifTitle"">{0}:</span>&nbsp; <span class=""Normal"">{1}; {2}</span></div>", _
                '    oProp.Key, _
                '    oProp.Value.Description, _
                '    oProp.Value.Value)
                '*** end of debug ***
            Next

            divImageMetaData.InnerHtml = sb.ToString()

        End Sub

        Private Function GetDimensions(ByVal oImage As IFileInfo) As String

            Dim NewWidth As Integer = 500
            Dim MaxHeight As Integer = 500

            If oImage.Width <= NewWidth Then
                NewWidth = oImage.Width
            End If

            Dim NewHeight As Integer = CType(oImage.Height * NewWidth / oImage.Width, Integer)

            If NewHeight > MaxHeight Then
                NewWidth = CType(oImage.Width * MaxHeight / oImage.Height, Integer)
                NewHeight = MaxHeight
            End If

            Return String.Format(" height=""{0}"" width=""{1}""", NewHeight.ToString, NewWidth.ToString)

        End Function

        Private Sub LocalizeModule()

            cmdCancel.Text = GetLocalizedString("cmdCancel.Text")
            cmdUpdate.Text = GetLocalizedString("cmdUpdate.Text")
            cmdDelete.Text = GetLocalizedString("cmdDelete.Text")

            rfvImageDescription.ErrorMessage = GetLocalizedString("rfvImageDescription.ErrorMessage")
            rfvImageTitle.ErrorMessage = GetLocalizedString("rfvImageTitle.ErrorMessage")

        End Sub

        Private Sub SaveImage()

            Dim ctlModule As New LightboxController
            Dim oImage As ImageInfo = ctlModule.GetImageById(Me.ImageId)
            Dim sec As New PortalSecurity

            oImage.Title = sec.InputFilter(Me.txtImageTitle.Text.Trim, PortalSecurity.FilterFlag.NoMarkup)
            oImage.Description = sec.InputFilter(Me.txtImageDescription.Text.Trim, PortalSecurity.FilterFlag.NoScripting)

            ctlModule.UpdateImage(oImage.ImageId, oImage.LightboxId, oImage.FileName, oImage.Title, oImage.Description, oImage.DisplayOrder, UserId)

            SendToModule()

        End Sub

        Private Sub DeleteImage()

            If Me.ImageId <> Null.NullInteger Then

                Dim ctlLightbox As New LightboxController
                Dim oLightbox As LightboxInfo = ctlLightbox.GetLightbox(Me.LightboxId)
                Dim oImage As ImageInfo = ctlLightbox.GetImageById(Me.ImageId)
                Dim oFolder As IFolderInfo = FolderManager.Instance().GetFolder(Me.PortalId, oLightbox.GalleryFolder)

                If FileManager.Instance().FileExists(oFolder, oImage.FileName) Then

                    Dim oFile As IFileInfo = FileManager.Instance().GetFile(oFolder, oImage.FileName)
                    FileManager.Instance().DeleteFile(oFile)

                    Dim strThumbnail As String = GetThumbnailImageName(oImage.FileName, Me.PortalSettings, False)

                    If FileManager.Instance().FileExists(oFolder, strThumbnail) Then
                        oFile = FileManager.Instance().GetFile(oFolder, strThumbnail)
                        FileManager.Instance().DeleteFile(oFile)
                    End If

                    ctlLightbox.DeleteImageById(Me.ImageId)

                End If

                Me.SendToModule()

            End If

        End Sub

        Private Sub SendToModule()

            Response.Redirect(NavigateURL)
            
        End Sub

        Private Sub HandleException(ByVal exc As Exception)
            LogException(exc)
            If Me.UserInfo.IsSuperUser Or Me.UserInfo.UserID = PortalSettings.AdministratorId Then
                AddModuleMessage(Me, _
                    String.Concat(exc.Message, "<br />", exc.StackTrace), _
                    Skins.Controls.ModuleMessage.ModuleMessageType.RedError)
            Else
                AddModuleMessage(Me, exc.Message, _
                    Skins.Controls.ModuleMessage.ModuleMessageType.RedError)
            End If
        End Sub

#End Region

    End Class

End Namespace