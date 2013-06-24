package com.service.cloud.mobile;

import android.app.Activity;

import com.salesforce.androidsdk.app.ForceApp;
import com.salesforce.androidsdk.ui.SalesforceDroidGapActivity;


public class FieldServiceApp extends ForceApp {

	@Override
	public Class<? extends Activity> getMainActivityClass() {
		return SalesforceDroidGapActivity.class;
	}
	
	@Override
	protected String getKey(String name) {
		return null;
	}

}
